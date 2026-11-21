const prisma = require("../../shared/db/prisma");

function create(data, db = prisma) {
  return db.inventoryLog.create({ data });
}

// Newest first. id breaks ties for rows written in the same millisecond.
function findByItem(outletId, menuItemId, limit, db = prisma) {
  return db.inventoryLog.findMany({
    where: { outletId, menuItemId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

function createMany(rows, db = prisma) {
  return db.inventoryLog.createMany({ data: rows });
}

module.exports = { create, createMany, findByItem };
