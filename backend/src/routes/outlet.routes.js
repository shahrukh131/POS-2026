const { Router } = require("express");

// Outlet endpoints (/:outletId/menu, /:outletId/sales) plug in here.
const router = Router({ mergeParams: true });

module.exports = router;
