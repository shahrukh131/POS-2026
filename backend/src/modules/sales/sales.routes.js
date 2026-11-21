const { Router } = require("express");
const validate = require("../../shared/middleware/validate");
const v = require("./sales.validator");
const salesController = require("./sales.controller");

// Outlet: /api/outlets/:outletId/sales
const router = Router({ mergeParams: true });

router.post("/", validate(v.createSale), salesController.create);
router.get("/:saleId", validate(v.getSale), salesController.getById);

module.exports = router;
