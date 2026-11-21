const { z } = require("zod");
const { id, bodyId } = require("./common.validator");

// Strict objects: the client can't send unitPrice/price/total (rule 21: prices come from the server).
const saleLine = z.strictObject({
  menuItemId: bodyId,
  quantity: z.number().int().min(1).max(1000), // rule 17
});

const createSale = {
  params: z.object({ outletId: id }),
  body: z.strictObject({
    items: z.array(saleLine).min(1).max(50),
    clientId: z.uuid().optional(), // rule 25: offline idempotency key
  }),
};

const getSale = {
  params: z.object({ outletId: id, saleId: id }),
};

module.exports = { createSale, getSale };
