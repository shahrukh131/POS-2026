const { Router } = require("express");
const hqRoutes = require("./hq.routes");
const outletRoutes = require("./outlet.routes");

const router = Router();

router.use("/hq", hqRoutes);
router.use("/outlets", outletRoutes);

module.exports = router;
