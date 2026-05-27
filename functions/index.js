/**
 * CampusHub — Cloud Functions entry point.
 * Funkcije se dodajajo po korakih (glej README.md).
 */
const { onRequest } = require("firebase-functions/v2/https");

// Korak 0: preverjanje, da emulatorji in Functions delujejo
exports.health = onRequest((req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CampusHub",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});
