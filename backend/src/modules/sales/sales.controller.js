const saleService = require("./sales.service");
const { sendSuccess } = require("../../shared/utils/response");

// 201 = new sale; 200 = existing sale returned for a re-sent clientId (idempotent replay).
async function create(req, res) {
  const { params, body } = req.validated;
  const { sale, replayed } = await saleService.createSale(params.outletId, body);
  sendSuccess(res, sale, replayed ? 200 : 201);
}

async function getById(req, res) {
  const { outletId, saleId } = req.validated.params;
  sendSuccess(res, await saleService.getSale(outletId, saleId));
}

module.exports = { create, getById };
