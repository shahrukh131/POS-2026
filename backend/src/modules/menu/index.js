// Public API of the menu module. Other modules may require only this file.
// Owns: menu_items, outlet_menu_items. Depends on: outlet, inventory.
const { Router } = require("express");
const menuItemRoutes = require("./menuItem.routes");
const assignmentRoutes = require("./assignment.routes");
const outletMenuRoutes = require("./outletMenu.routes");
const { findAssignmentsForSale } = require("./assignment.service");

// Mounted under /api/hq
const hqRoutes = Router();
hqRoutes.use("/outlets/:outletId/menu-items", assignmentRoutes);
hqRoutes.use("/menu-items", menuItemRoutes);

// Mounted under /api
const outletRoutes = Router();
outletRoutes.use("/outlets/:outletId/menu", outletMenuRoutes);

module.exports = { hqRoutes, outletRoutes, findAssignmentsForSale };
