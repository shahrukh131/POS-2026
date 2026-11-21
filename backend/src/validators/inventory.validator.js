const { z } = require("zod");
const { id } = require("./common.validator");

// Per-request cap keeps stock far below INT4 max (an overflow would surface as a 500).
const MAX_QTY = 1000000;

const outletParams = z.object({ outletId: id });
const itemParams = z.object({ outletId: id, menuItemId: id });
const note = z.string().trim().min(1).max(255).optional();

const listInventory = { params: outletParams };

// Rule 14: restock adds quantity > 0.
const restock = {
  params: itemParams,
  body: z.strictObject({
    quantity: z.number().int().min(1).max(MAX_QTY),
    note,
  }),
};

// Rule 15: adjust sets an absolute quantity ≥ 0.
const adjust = {
  params: itemParams,
  body: z.strictObject({
    quantity: z.number().int().min(0).max(MAX_QTY),
    note,
  }),
};

const listLogs = {
  params: itemParams,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
};

module.exports = { listInventory, restock, adjust, listLogs };
