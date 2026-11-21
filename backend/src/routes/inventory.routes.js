const { Router } = require("express");
const validate = require("../middlewares/validate");
const v = require("../validators/inventory.validator");
const inventoryController = require("../controllers/inventory.controller");

// HQ: /api/hq/outlets/:outletId/inventory
const router = Router({ mergeParams: true });

router.get("/", validate(v.listInventory), inventoryController.list);
router.post("/:menuItemId/restock", validate(v.restock), inventoryController.restock);
router.put("/:menuItemId", validate(v.adjust), inventoryController.adjust);
router.get("/:menuItemId/logs", validate(v.listLogs), inventoryController.logs);

module.exports = router;
