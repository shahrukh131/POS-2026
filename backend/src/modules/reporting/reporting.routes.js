const { Router } = require("express");
const validate = require("../../shared/middleware/validate");
const v = require("./reporting.validator");
const reportingController = require("./reporting.controller");

// HQ: /api/hq/reports
const router = Router();

router.get("/revenue-by-outlet", validate(v.revenueByOutlet), reportingController.revenueByOutlet);
router.get("/top-items", validate(v.topItems), reportingController.topItems);

module.exports = router;
