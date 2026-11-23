const { Router } = require("express");
const eventsController = require("./events.controller");

// HQ: /api/hq/events (SSE). No input, so no validator.
const router = Router();

router.get("/", eventsController.stream);

module.exports = router;
