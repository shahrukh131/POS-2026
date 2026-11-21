const { Router } = require("express");
const validate = require("../../shared/middleware/validate");
const v = require("./inventory.validator");
const inventoryController = require("./inventory.controller");

// HQ: /api/hq/outlets/:outletId/inventory
const router = Router({ mergeParams: true });

router.get("/", validate(v.listInventory), inventoryController.list);
router.post("/:menuItemId/restock", validate(v.restock), inventoryController.restock);
router.put("/:menuItemId", validate(v.adjust), inventoryController.adjust);
router.get("/:menuItemId/logs", validate(v.listLogs), inventoryController.logs);

module.exports = router;
