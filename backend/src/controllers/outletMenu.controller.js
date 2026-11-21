const outletMenuService = require("../services/outletMenu.service");
const { sendSuccess } = require("../utils/response");

async function getMenu(req, res) {
  sendSuccess(res, await outletMenuService.getMenu(req.validated.params.outletId));
}

module.exports = { getMenu };
