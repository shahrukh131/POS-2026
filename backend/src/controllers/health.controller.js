const healthService = require("../services/health.service");
const { sendSuccess } = require("../utils/response");

async function getHealth(req, res) {
  const result = await healthService.check();
  sendSuccess(res, result);
}

module.exports = { getHealth };
