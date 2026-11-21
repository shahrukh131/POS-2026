const { Router } = require("express");
const validate = require("../middlewares/validate");
const menuValidator = require("../validators/outletMenu.validator");
const saleValidator = require("../validators/sale.validator");
const outletMenuController = require("../controllers/outletMenu.controller");
const saleController = require("../controllers/sale.controller");

// Outlet-facing endpoints: /api/outlets/:outletId/...
const router = Router({ mergeParams: true });

router.get("/:outletId/menu", validate(menuValidator.getMenu), outletMenuController.getMenu);
router.post("/:outletId/sales", validate(saleValidator.createSale), saleController.create);
router.get("/:outletId/sales/:saleId", validate(saleValidator.getSale), saleController.getById);

module.exports = router;
