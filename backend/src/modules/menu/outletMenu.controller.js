const outletMenuService = require("./outletMenu.service");
const { sendSuccess } = require("../../shared/utils/response");

async function getMenu(req, res) {
  sendSuccess(res, await outletMenuService.getMenu(req.validated.params.outletId));
}

module.exports = { getMenu };
