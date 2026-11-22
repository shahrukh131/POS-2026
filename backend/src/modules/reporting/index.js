// Public API of the reporting module. Read-only: owns no tables, sits on top of all modules.
// Reads outlets, sales, sale_items, menu_items via raw read-only joins (see split points).
const { Router } = require("express");
const reportingRoutes = require("./reporting.routes");

// Mounted under /api/hq
const hqRoutes = Router();
hqRoutes.use("/reports", reportingRoutes);

module.exports = { hqRoutes };
