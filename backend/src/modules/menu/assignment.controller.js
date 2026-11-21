const assignmentService = require("./assignment.service");
const { sendSuccess } = require("../../shared/utils/response");

async function create(req, res) {
  const { params, body } = req.validated;
  sendSuccess(res, await assignmentService.assignMenuItem(params.outletId, body), 201);
}

async function list(req, res) {
  sendSuccess(res, await assignmentService.listAssignments(req.validated.params.outletId));
}

async function update(req, res) {
  const { params, body } = req.validated;
  sendSuccess(res, await assignmentService.updateAssignment(params.outletId, params.menuItemId, body));
}

module.exports = { create, list, update };
