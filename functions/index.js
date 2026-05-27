/**
 * CampusHub — Cloud Functions entry point.
 * Funkcije se dodajajo po korakih (glej README.md).
 */
const admin = require("firebase-admin");
const { user } = require("firebase-functions/v1/auth");
const functionsV1 = require("firebase-functions/v1");
const { PubSub } = require("@google-cloud/pubsub");
const { FieldValue } = require("firebase-admin/firestore");
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { onMessagePublished } = require("firebase-functions/v2/pubsub");
const {
  onCall,
  onRequest,
  HttpsError,
} = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();
const db = admin.firestore();
const storageTriggerBucket = `${process.env.GCLOUD_PROJECT || "demo-campushub"}.appspot.com`;
const notificationsTopic = "notifications";
const pubsub = new PubSub();

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  return request.auth;
}

function sanitizeProfileInput(data) {
  const updates = {};

  if (typeof data.displayName === "string") {
    updates.displayName = data.displayName.trim().slice(0, 120);
  }
  if (typeof data.faculty === "string") {
    updates.faculty = data.faculty.trim().slice(0, 120);
  }

  return updates;
}

async function requireAdmin(auth) {
  if (!auth || !auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const userDoc = await db.collection("users").doc(auth.uid).get();
  const role = userDoc.exists ? userDoc.data().role : null;
  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Admin access is required.");
  }
}

async function getUserRole(uid) {
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return null;
  }
  return userDoc.data().role || null;
}

async function requireRole(auth, allowedRoles) {
  if (!auth || !auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }
  const role = await getUserRole(auth.uid);
  if (!allowedRoles.includes(role)) {
    throw new HttpsError(
      "permission-denied",
      `Required role: ${allowedRoles.join(" or ")}.`
    );
  }
  return role;
}

function parseMaterialPath(path) {
  if (typeof path !== "string") {
    return null;
  }
  const match = path.match(/^events\/([^/]+)\/materials\/(.+)$/);
  if (!match) {
    return null;
  }
  return {
    eventId: match[1],
    fileName: match[2],
  };
}

async function publishNotification(payload) {
  const json = JSON.stringify(payload);
  await pubsub.topic(notificationsTopic).publishMessage({
    data: Buffer.from(json),
  });
}

function asDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d;
}

// Korak 0: preverjanje, da emulatorji in Functions delujejo
exports.health = onRequest((req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CampusHub",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Korak 1: ob registraciji uporabnika ustvarimo začetni profil.
exports.onUserCreated = user().onCreate(async (userRecord) => {
  if (!userRecord || !userRecord.uid) {
    return;
  }

  const userRef = db.collection("users").doc(userRecord.uid);
  const snap = await userRef.get();
  if (snap.exists) {
    return;
  }

  await userRef.set({
    email: userRecord.email || null,
    displayName: userRecord.displayName || "",
    faculty: "",
    role: "student",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
});

// Vrne profil prijavljenega uporabnika.
exports.getMyProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  const userRef = db.collection("users").doc(auth.uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "User profile does not exist.");
  }

  return {
    uid: auth.uid,
    ...snap.data(),
  };
});

// Posodobi osnovne podatke profila prijavljenega uporabnika.
exports.updateMyProfile = onCall(async (request) => {
  const auth = requireAuth(request);
  const data = request.data || {};
  const updates = sanitizeProfileInput(data);

  if (Object.keys(updates).length === 0) {
    throw new HttpsError(
      "invalid-argument",
      "At least one updatable field must be provided."
    );
  }

  updates.updatedAt = FieldValue.serverTimestamp();
  await db.collection("users").doc(auth.uid).set(updates, { merge: true });

  const updatedSnap = await db.collection("users").doc(auth.uid).get();
  return {
    uid: auth.uid,
    ...updatedSnap.data(),
  };
});

// Admin lahko spremeni vlogo uporabnika.
exports.setUserRole = onCall(async (request) => {
  const auth = requireAuth(request);
  await requireAdmin(auth);

  const { uid, role } = request.data || {};
  const allowedRoles = ["student", "organizer", "admin"];

  if (typeof uid !== "string" || uid.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Field 'uid' is required.");
  }
  if (!allowedRoles.includes(role)) {
    throw new HttpsError(
      "invalid-argument",
      "Field 'role' must be student, organizer or admin."
    );
  }

  const targetUid = uid.trim();
  await admin.auth().setCustomUserClaims(targetUid, { role });
  await db.collection("users").doc(targetUid).set(
    {
      role,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    success: true,
    uid: targetUid,
    role,
  };
});

// Korak 2: organizer/admin ustvari dogodek v stanju draft.
exports.createEvent = onCall(async (request) => {
  const auth = requireAuth(request);
  await requireRole(auth, ["organizer", "admin"]);

  const data = request.data || {};
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  const startAt = typeof data.startAt === "string" ? data.startAt : "";
  const endAt = typeof data.endAt === "string" ? data.endAt : "";
  const capacity = Number(data.capacity);

  if (!title || !description || !startAt || !endAt || !Number.isFinite(capacity)) {
    throw new HttpsError(
      "invalid-argument",
      "title, description, startAt, endAt and capacity are required."
    );
  }
  if (capacity <= 0) {
    throw new HttpsError("invalid-argument", "capacity must be greater than 0.");
  }

  const eventRef = db.collection("events").doc();
  await eventRef.set({
    title,
    description,
    startAt,
    endAt,
    capacity,
    status: "draft",
    organizerId: auth.uid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    eventId: eventRef.id,
    status: "draft",
  };
});

// Organizer (lastnik) ali admin objavi dogodek.
exports.publishEvent = onCall(async (request) => {
  const auth = requireAuth(request);
  const callerRole = await requireRole(auth, ["organizer", "admin"]);
  const eventId =
    request.data && typeof request.data.eventId === "string"
      ? request.data.eventId.trim()
      : "";

  if (!eventId) {
    throw new HttpsError("invalid-argument", "Field 'eventId' is required.");
  }

  const eventRef = db.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new HttpsError("not-found", "Event does not exist.");
  }

  const eventData = eventSnap.data();
  if (callerRole !== "admin" && eventData.organizerId !== auth.uid) {
    throw new HttpsError(
      "permission-denied",
      "You can publish only your own events."
    );
  }

  await eventRef.set(
    {
      status: "published",
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    eventId,
    status: "published",
  };
});

// Javni seznam objavljenih dogodkov.
exports.listEvents = onRequest(async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const snap = await db
    .collection("events")
    .where("status", "==", "published")
    .orderBy("startAt", "asc")
    .limit(50)
    .get();

  const events = snap.docs.map((doc) => ({
    eventId: doc.id,
    ...doc.data(),
  }));

  res.status(200).json({ events });
});

// Javni detalji enega dogodka po eventId query parametru.
exports.getEventDetails = onRequest(async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const eventId = typeof req.query.eventId === "string" ? req.query.eventId : "";
  if (!eventId) {
    res.status(400).json({ error: "Query param 'eventId' is required." });
    return;
  }

  const snap = await db.collection("events").doc(eventId).get();
  if (!snap.exists) {
    res.status(404).json({ error: "Event not found." });
    return;
  }

  const data = snap.data();
  if (data.status !== "published") {
    res.status(403).json({ error: "Event is not published." });
    return;
  }

  res.status(200).json({
    eventId: snap.id,
    ...data,
  });
});

// Ob prehodu draft -> published zapišemo dogodek v audit log.
exports.onEventPublished = onDocumentUpdated("events/{eventId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (!before || !after) {
    return;
  }
  if (before.status === "published" || after.status !== "published") {
    return;
  }

  await db.collection("auditLogs").add({
    action: "EVENT_PUBLISHED",
    eventId: event.params.eventId,
    organizerId: after.organizerId || null,
    severity: "info",
    timestamp: FieldValue.serverTimestamp(),
  });
});

// Korak 3: student se prijavi na objavljen dogodek.
exports.registerForEvent = onCall(async (request) => {
  const auth = requireAuth(request);
  await requireRole(auth, ["student", "admin"]);

  const eventId =
    request.data && typeof request.data.eventId === "string"
      ? request.data.eventId.trim()
      : "";
  if (!eventId) {
    throw new HttpsError("invalid-argument", "Field 'eventId' is required.");
  }

  const eventRef = db.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    throw new HttpsError("not-found", "Event does not exist.");
  }
  const eventData = eventSnap.data();
  if (eventData.status !== "published") {
    throw new HttpsError("failed-precondition", "Event is not published.");
  }

  const registrationRef = db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .doc(auth.uid);

  await db.runTransaction(async (tx) => {
    const existingReg = await tx.get(registrationRef);
    if (existingReg.exists && existingReg.data().status === "registered") {
      throw new HttpsError("already-exists", "You are already registered.");
    }

    const regsSnap = await tx.get(
      db
        .collection("events")
        .doc(eventId)
        .collection("registrations")
        .where("status", "==", "registered")
    );

    const currentCount = regsSnap.size;
    const capacity = Number(eventData.capacity || 0);
    if (currentCount >= capacity) {
      throw new HttpsError("resource-exhausted", "Event is full.");
    }

    tx.set(
      registrationRef,
      {
        userId: auth.uid,
        status: "registered",
        registeredAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return {
    eventId,
    userId: auth.uid,
    status: "registered",
  };
});

// Student se odjavi iz dogodka.
exports.cancelRegistration = onCall(async (request) => {
  const auth = requireAuth(request);
  await requireRole(auth, ["student", "admin"]);

  const eventId =
    request.data && typeof request.data.eventId === "string"
      ? request.data.eventId.trim()
      : "";
  if (!eventId) {
    throw new HttpsError("invalid-argument", "Field 'eventId' is required.");
  }

  const registrationRef = db
    .collection("events")
    .doc(eventId)
    .collection("registrations")
    .doc(auth.uid);

  const regSnap = await registrationRef.get();
  if (!regSnap.exists || regSnap.data().status !== "registered") {
    throw new HttpsError("not-found", "Active registration not found.");
  }

  await registrationRef.set(
    {
      status: "cancelled",
      cancelledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    eventId,
    userId: auth.uid,
    status: "cancelled",
  };
});

// Ob novi prijavi zapišemo audit log.
exports.onRegistrationCreated = onDocumentCreated(
  "events/{eventId}/registrations/{registrationId}",
  async (event) => {
    const registration = event.data.data();
    await db.collection("auditLogs").add({
      action: "REGISTRATION_CREATED",
      eventId: event.params.eventId,
      registrationId: event.params.registrationId,
      userId: registration.userId || null,
      severity: "info",
      timestamp: FieldValue.serverTimestamp(),
    });
  }
);

// Ob spremembi statusa prijave zapišemo audit log.
exports.onRegistrationUpdated = onDocumentUpdated(
  "events/{eventId}/registrations/{registrationId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (!before || !after || before.status === after.status) {
      return;
    }

    await db.collection("auditLogs").add({
      action: "REGISTRATION_STATUS_UPDATED",
      eventId: event.params.eventId,
      registrationId: event.params.registrationId,
      userId: after.userId || null,
      fromStatus: before.status || null,
      toStatus: after.status || null,
      severity: "info",
      timestamp: FieldValue.serverTimestamp(),
    });
  }
);

// Korak 4: vrne navodila za upload materiala v Storage.
exports.getUploadUrl = onCall(async (request) => {
  const auth = requireAuth(request);
  const role = await requireRole(auth, ["organizer", "admin"]);

  const eventId =
    request.data && typeof request.data.eventId === "string"
      ? request.data.eventId.trim()
      : "";
  const fileName =
    request.data && typeof request.data.fileName === "string"
      ? request.data.fileName.trim()
      : "";

  if (!eventId || !fileName) {
    throw new HttpsError(
      "invalid-argument",
      "Fields 'eventId' and 'fileName' are required."
    );
  }

  const eventSnap = await db.collection("events").doc(eventId).get();
  if (!eventSnap.exists) {
    throw new HttpsError("not-found", "Event does not exist.");
  }
  const eventData = eventSnap.data();
  if (role !== "admin" && eventData.organizerId !== auth.uid) {
    throw new HttpsError(
      "permission-denied",
      "You can upload materials only for your own events."
    );
  }

  const storagePath = `events/${eventId}/materials/${fileName}`;
  return {
    eventId,
    fileName,
    storagePath,
    uploadHint:
      "Upload file to this exact path in Storage emulator (or SDK client).",
  };
});

// Ob uploadu materiala zapišemo metapodatke v Firestore.
exports.onMaterialUploaded = functionsV1.storage
  .bucket(storageTriggerBucket)
  .object()
  .onFinalize(async (object) => {
    const fullPath = object && object.name ? object.name : null;
    const parsed = parseMaterialPath(fullPath);
    if (!parsed) {
      return;
    }

    let ownerUid =
      object.metadata && typeof object.metadata.uploadedBy === "string"
        ? object.metadata.uploadedBy
        : null;

    // Emulator UI upload ne pošlje metadata.uploadedBy, zato uporabimo organizerja eventa.
    if (!ownerUid) {
      const eventSnap = await db.collection("events").doc(parsed.eventId).get();
      if (eventSnap.exists) {
        ownerUid = eventSnap.data().organizerId || null;
      }
    }

    await db.collection("materials").add({
      eventId: parsed.eventId,
      storagePath: fullPath,
      fileName: parsed.fileName,
      uploadedBy: ownerUid,
      contentType: object.contentType || null,
      size: object.size ? Number(object.size) : null,
      uploadedAt: FieldValue.serverTimestamp(),
    });
  });

// Ob brisanju materiala počistimo metapodatke.
exports.onMaterialDeleted = functionsV1.storage
  .bucket(storageTriggerBucket)
  .object()
  .onDelete(async (object) => {
    const fullPath = object && object.name ? object.name : null;
  const parsed = parseMaterialPath(fullPath);
  if (!parsed) {
    return;
  }

  const snap = await db
    .collection("materials")
    .where("storagePath", "==", fullPath)
    .limit(20)
    .get();

  if (snap.empty) {
    return;
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  });

// Korak 5: enqueue obvestila v Pub/Sub topic.
exports.enqueueNotification = onCall(async (request) => {
  const auth = requireAuth(request);
  await requireRole(auth, ["organizer", "admin"]);

  const data = request.data || {};
  const eventId = typeof data.eventId === "string" ? data.eventId.trim() : "";
  const type = typeof data.type === "string" ? data.type.trim() : "generic";
  const title = typeof data.title === "string" ? data.title.trim() : "";
  const body = typeof data.body === "string" ? data.body.trim() : "";

  if (!eventId || !title || !body) {
    throw new HttpsError(
      "invalid-argument",
      "Fields 'eventId', 'title' and 'body' are required."
    );
  }

  const payload = {
    type,
    eventId,
    title,
    body,
    createdBy: auth.uid,
    createdAt: new Date().toISOString(),
  };

  await publishNotification(payload);
  return { success: true, topic: notificationsTopic, payload };
});

// Pub/Sub consumer: shrani obvestilo v Firestore (in kasneje lahko pošilja email).
exports.processNotification = onMessagePublished(notificationsTopic, async (event) => {
  const msg = event.data.message;
  let payload = {};

  if (msg.json && typeof msg.json === "object") {
    payload = msg.json;
  } else if (msg.data) {
    try {
      const decoded = Buffer.from(msg.data, "base64").toString("utf8");
      payload = JSON.parse(decoded);
    } catch (err) {
      payload = {
        rawData: msg.data,
      };
    }
  }

  await db.collection("notifications").add({
    ...payload,
    messageId: msg.messageId || null,
    publishedAt: FieldValue.serverTimestamp(),
  });
});

// Ob objavi dogodka enqueue obvestilo "nov dogodek".
exports.onEventPublishedNotify = onDocumentUpdated("events/{eventId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (!before || !after) {
    return;
  }
  if (before.status === "published" || after.status !== "published") {
    return;
  }

  await publishNotification({
    type: "event_published",
    eventId: event.params.eventId,
    title: `Nov dogodek: ${after.title || "CampusHub event"}`,
    body: "Dogodek je bil pravkar objavljen.",
    organizerId: after.organizerId || null,
    createdAt: new Date().toISOString(),
  });
});

// Korak 6: dnevni opomniki za dogodke, ki so v naslednjih ~24 urah.
exports.sendEventReminders = onSchedule("every day 08:00", async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const snap = await db.collection("events").where("status", "==", "published").get();
  let remindersSent = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const start = asDate(data.startAt);
    if (!start) {
      continue;
    }
    if (start > now && start <= in24h) {
      await publishNotification({
        type: "event_reminder",
        eventId: doc.id,
        title: `Opomnik: ${data.title || "Dogodek"}`,
        body: "Dogodek se začne v manj kot 24 urah.",
        createdAt: new Date().toISOString(),
      });
      remindersSent += 1;
    }
  }

  await db.collection("reports").add({
    type: "daily_reminders",
    remindersSent,
    generatedAt: FieldValue.serverTimestamp(),
  });
});

// Korak 6: tedensko arhiviranje starih dogodkov.
exports.archiveOldEvents = onSchedule("every sunday 03:00", async () => {
  const now = new Date();
  const archivedBefore = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const snap = await db.collection("events").where("status", "==", "published").get();
  const batch = db.batch();
  let archivedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const end = asDate(data.endAt);
    if (!end) {
      continue;
    }
    if (end < archivedBefore) {
      batch.set(
        doc.ref,
        {
          status: "archived",
          archivedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      archivedCount += 1;
    }
  }

  if (archivedCount > 0) {
    await batch.commit();
  }

  await db.collection("reports").add({
    type: "archive_old_events",
    archivedCount,
    generatedAt: FieldValue.serverTimestamp(),
  });
});

// Korak 6: tedensko poročilo prijav.
exports.generateWeeklyReport = onSchedule("every monday 07:00", async () => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const eventsSnap = await db.collection("events").get();
  let totalRegistrations = 0;
  let totalCancelled = 0;

  for (const eventDoc of eventsSnap.docs) {
    const regsSnap = await eventDoc.ref.collection("registrations").get();
    regsSnap.docs.forEach((regDoc) => {
      const reg = regDoc.data();
      const updatedAt = reg.updatedAt && reg.updatedAt.toDate
        ? reg.updatedAt.toDate()
        : null;

      if (updatedAt && updatedAt < weekAgo) {
        return;
      }
      if (reg.status === "registered") {
        totalRegistrations += 1;
      } else if (reg.status === "cancelled") {
        totalCancelled += 1;
      }
    });
  }

  const weekKey = `${now.getUTCFullYear()}-W${Math.ceil(
    ((now - new Date(Date.UTC(now.getUTCFullYear(), 0, 1))) / 86400000 + 1) / 7
  )}`;

  await db.collection("reports").add({
    type: "weekly_registrations",
    week: weekKey,
    totalRegistrations,
    totalCancelled,
    generatedAt: FieldValue.serverTimestamp(),
  });
});
