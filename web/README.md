# CampusHub Web (frontend)

React + Vite SPA connected to the CampusHub Firebase FaaS backend.

## Setup

```bash
cd web
cp .env.example .env
npm install
```

`.env` (defaults for local emulators):

```env
VITE_FIREBASE_PROJECT_ID=faas-b43b4
VITE_USE_EMULATORS=true
VITE_FUNCTIONS_REGION=us-central1
```

## Run locally

**Terminal 1** (repo root) — emulators must include Auth, Functions, Firestore, Storage, Pub/Sub:

```bash
npm run emulators
```

**Terminal 2**:

```bash
npm run dev:web
```

Open http://localhost:5173

## App routes

| Route | Who | Backend APIs |
|-------|-----|----------------|
| `/` → `/events` | All (logged in) | `listEvents`, `getEventDetails` |
| `/account` | All | `getMyProfile`, `updateMyProfile`, `health` |
| `/notifications` | All | `listNotifications` |
| `/organize` | Organizer, admin | `createEvent`, `publishEvent`, `listMyEvents` |
| `/organize/:id/materials` | Organizer, admin | `getUploadUrl`, Storage upload, `listEventMaterials` |
| `/organize/:id/notify` | Organizer, admin | `enqueueNotification` |
| `/admin` | Admin | `setUserRole` |
| `/admin/reports` | Admin | `listReports` (+ manual cron run in emulator) |

Event detail page also uses `registerForEvent`, `cancelRegistration`, `getMyRegistration` (students).

## Roles (testing)

New users get `student` via `onUserCreated`. To test other roles:

- **Firestore:** `users/{uid}` → field `role` = `organizer` | `admin`
- **Admin UI:** `/admin` → `setUserRole` (requires admin account)

Refresh the browser after role changes.

## Notifications flow

1. Organizer sends via **Notify** → `enqueueNotification`
2. Message → Pub/Sub topic `notifications`
3. `processNotification` writes to Firestore `notifications`
4. All users see entries under **Notifications** (and on event page)

No email is sent in the current build (Firestore + in-app list only).

## Deploy (Firebase Hosting)

From repo root (after `firebase login` and `npm run build:web`):

```bash
npm run deploy:hosting
```

- **Hosting (static site):** Spark plan is usually enough.
- **Cloud Functions in production:** typically requires **Blaze** billing.

For production, set `VITE_USE_EMULATORS=false` and use real Firebase web config from the console when you add a production env file.
