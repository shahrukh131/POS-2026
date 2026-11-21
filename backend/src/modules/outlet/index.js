// Public API of the outlet module. Other modules may require only this file.
// Owns: outlets, outlet_receipt_counters. Depends on: nothing.
const { Router } = require("express");
const outletRoutes = require("./outlet.routes");
const { findById, ensureExists, nextReceiptNumber } = require("./outlet.service");

// Mounted under /api/hq
const hqRoutes = Router();
hqRoutes.use("/outlets", outletRoutes);

module.exports = { hqRoutes, findById, ensureExists, nextReceiptNumber };
