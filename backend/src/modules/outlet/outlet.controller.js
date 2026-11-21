const outletService = require("./outlet.service");
const { sendSuccess } = require("../../shared/utils/response");

async function create(req, res) {
  sendSuccess(res, await outletService.createOutlet(req.validated.body), 201);
}

async function list(req, res) {
  sendSuccess(res, await outletService.listOutlets());
}

async function getById(req, res) {
  sendSuccess(res, await outletService.getOutlet(req.validated.params.id));
}

async function update(req, res) {
  sendSuccess(res, await outletService.updateOutlet(req.validated.params.id, req.validated.body));
}

module.exports = { create, list, getById, update };
