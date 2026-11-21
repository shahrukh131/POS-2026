const { Router } = require("express");
const validate = require("../middlewares/validate");
const v = require("../validators/menuItem.validator");
const menuItemController = require("../controllers/menuItem.controller");

// HQ: /api/hq/menu-items
const router = Router();

router.post("/", validate(v.createMenuItem), menuItemController.create);
router.get("/", validate(v.listMenuItems), menuItemController.list);
router.get("/:id", validate(v.menuItemIdParam), menuItemController.getById);
router.patch("/:id", validate(v.updateMenuItem), menuItemController.update);

module.exports = router;
