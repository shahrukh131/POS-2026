const menuItemService = require("./menuItem.service");
const { sendSuccess } = require("../../shared/utils/response");

async function create(req, res) {
  sendSuccess(res, await menuItemService.createMenuItem(req.validated.body), 201);
}

async function list(req, res) {
  sendSuccess(res, await menuItemService.listMenuItems(req.validated.query));
}

async function getById(req, res) {
  sendSuccess(res, await menuItemService.getMenuItem(req.validated.params.id));
}

async function update(req, res) {
  sendSuccess(res, await menuItemService.updateMenuItem(req.validated.params.id, req.validated.body));
}

module.exports = { create, list, getById, update };
