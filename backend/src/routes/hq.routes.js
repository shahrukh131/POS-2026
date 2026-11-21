const { Router } = require("express");
const outletRoutes = require("./outlet.hq.routes");
const menuItemRoutes = require("./menuItem.routes");
const assignmentRoutes = require("./assignment.routes");
const inventoryRoutes = require("./inventory.routes");

// HQ endpoints. Reports plug in here later.
const router = Router();

// Nested outlet routes first, then the plain /outlets CRUD.
router.use("/outlets/:outletId/menu-items", assignmentRoutes);
router.use("/outlets/:outletId/inventory", inventoryRoutes);
router.use("/outlets", outletRoutes);
router.use("/menu-items", menuItemRoutes);

module.exports = router;
