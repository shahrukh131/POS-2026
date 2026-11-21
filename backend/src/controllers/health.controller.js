const healthService = require("../services/health.service");
const { ok } = require("../utils/response");

async function getHealth(req, res) {
  const result = await healthService.check();
  ok(res, result);
}

module.exports = { getHealth };
