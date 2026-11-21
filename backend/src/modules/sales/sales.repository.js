const prisma = require("../../shared/db/prisma");

const withItems = {
  items: {
    include: { menuItem: { select: { sku: true, name: true } } },
    orderBy: { menuItemId: "asc" },
  },
};

function create(data, db = prisma) {
  return db.sale.create({ data, include: withItems });
}

function findByClientId(clientId, db = prisma) {
  return db.sale.findUnique({ where: { clientId }, include: withItems });
}

// Scoped to the outlet: a sale of another outlet is "not found" here.
function findByIdInOutlet(saleId, outletId, db = prisma) {
  return db.sale.findFirst({ where: { id: saleId, outletId }, include: withItems });
}

module.exports = { create, findByClientId, findByIdInOutlet };
