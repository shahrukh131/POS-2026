const { Router } = require("express");
const validate = require("../../shared/middleware/validate");
const v = require("./menuItem.validator");
const menuItemController = require("./menuItem.controller");

// HQ: /api/hq/menu-items
const router = Router();

router.post("/", validate(v.createMenuItem), menuItemController.create);
router.get("/", validate(v.listMenuItems), menuItemController.list);
router.get("/:id", validate(v.menuItemIdParam), menuItemController.getById);
router.patch("/:id", validate(v.updateMenuItem), menuItemController.update);

module.exports = router;
