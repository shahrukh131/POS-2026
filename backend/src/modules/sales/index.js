// Public API of the sales module. Other modules may require only this file.
// Owns: sales, sale_items. Depends on: outlet, menu, inventory.
const { Router } = require("express");
const salesRoutes = require("./sales.routes");

// Mounted under /api
const outletRoutes = Router();
outletRoutes.use("/outlets/:outletId/sales", salesRoutes);

module.exports = { outletRoutes };
