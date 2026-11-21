const { Router } = require("express");
const validate = require("../middlewares/validate");
const v = require("../validators/outlet.validator");
const outletController = require("../controllers/outlet.controller");

// HQ: /api/hq/outlets
const router = Router();

router.post("/", validate(v.createOutlet), outletController.create);
router.get("/", outletController.list);
router.get("/:id", validate(v.outletIdParam), outletController.getById);
router.patch("/:id", validate(v.updateOutlet), outletController.update);

module.exports = router;
