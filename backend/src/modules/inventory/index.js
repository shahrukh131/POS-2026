// Public API of the inventory module. Other modules may require only this file.
// Owns: inventory, inventory_logs. Depends on: outlet.
const { Router } = require("express");
const inventoryRoutes = require("./inventory.routes");
const { initStock, deductStock, getQuantity, writeLogs } = require("./inventory.service");

// Mounted under /api/hq
const hqRoutes = Router();
hqRoutes.use("/outlets/:outletId/inventory", inventoryRoutes);

module.exports = { hqRoutes, initStock, deductStock, getQuantity, writeLogs };
