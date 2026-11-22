const { Router } = require("express");
const outlet = require("./modules/outlet");
const inventory = require("./modules/inventory");
const menu = require("./modules/menu");
const sales = require("./modules/sales");
const reporting = require("./modules/reporting");

// HQ: /api/hq/*. Nested /outlets/:outletId/* routes go before the plain /outlets CRUD.
const hq = Router();
hq.use(menu.hqRoutes);
hq.use(inventory.hqRoutes);
hq.use(outlet.hqRoutes);
hq.use(reporting.hqRoutes); // /reports/*

// /api
const api = Router();
api.use("/hq", hq);
api.use(menu.outletRoutes); //  /outlets/:outletId/menu
api.use(sales.outletRoutes); // /outlets/:outletId/sales

module.exports = api;
