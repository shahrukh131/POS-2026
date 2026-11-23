// Public API of the events module: live HQ updates over Server-Sent Events.
// Owns no tables. Listens on the shared in-process event bus (src/shared/events/eventBus.js).
const { Router } = require("express");
const eventsRoutes = require("./events.routes");
const { closeAllStreams } = require("./events.service");

// Mounted under /api/hq
const hqRoutes = Router();
hqRoutes.use("/events", eventsRoutes);

module.exports = { hqRoutes, closeAllStreams };
