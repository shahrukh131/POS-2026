const healthService = require("./health.service");
const { sendSuccess } = require("../../shared/utils/response");

async function getHealth(req, res) {
  const result = await healthService.check();
  sendSuccess(res, result);
}

module.exports = { getHealth };
