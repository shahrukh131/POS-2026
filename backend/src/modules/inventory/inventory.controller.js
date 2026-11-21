const inventoryService = require("./inventory.service");
const { sendSuccess } = require("../../shared/utils/response");

async function list(req, res) {
  sendSuccess(res, await inventoryService.listInventory(req.validated.params.outletId));
}

async function restock(req, res) {
  const { params, body } = req.validated;
  sendSuccess(res, await inventoryService.restock(params.outletId, params.menuItemId, body));
}

async function adjust(req, res) {
  const { params, body } = req.validated;
  sendSuccess(res, await inventoryService.adjust(params.outletId, params.menuItemId, body));
}

async function logs(req, res) {
  const { params, query } = req.validated;
  sendSuccess(res, await inventoryService.listLogs(params.outletId, params.menuItemId, query));
}

module.exports = { list, restock, adjust, logs };
