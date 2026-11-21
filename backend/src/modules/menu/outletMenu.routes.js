const { Router } = require("express");
const validate = require("../../shared/middleware/validate");
const v = require("./outletMenu.validator");
const outletMenuController = require("./outletMenu.controller");

// Outlet: /api/outlets/:outletId/menu
const router = Router({ mergeParams: true });

router.get("/", validate(v.getMenu), outletMenuController.getMenu);

module.exports = router;
