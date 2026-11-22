const reportingService = require("./reporting.service");
const { sendSuccess } = require("../../shared/utils/response");

async function revenueByOutlet(req, res) {
  sendSuccess(res, await reportingService.revenueByOutlet(req.validated.query));
}

async function topItems(req, res) {
  sendSuccess(res, await reportingService.topItems(req.validated.query));
}

module.exports = { revenueByOutlet, topItems };
