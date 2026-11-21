const { Router } = require("express");
const validate = require("../middlewares/validate");
const v = require("../validators/assignment.validator");
const assignmentController = require("../controllers/assignment.controller");

// HQ: /api/hq/outlets/:outletId/menu-items. No DELETE: unassign = PATCH isAvailable=false (rule 10).
const router = Router({ mergeParams: true });

router.post("/", validate(v.createAssignment), assignmentController.create);
router.get("/", validate(v.listAssignments), assignmentController.list);
router.patch("/:menuItemId", validate(v.updateAssignment), assignmentController.update);

module.exports = router;
