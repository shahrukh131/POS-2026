const { Router } = require("express");
const outletRoutes = require("./outlet.hq.routes");
const menuItemRoutes = require("./menuItem.routes");

// HQ endpoints. Assignments, inventory and reports plug in here later.
const router = Router();

router.use("/outlets", outletRoutes);
router.use("/menu-items", menuItemRoutes);

module.exports = router;
