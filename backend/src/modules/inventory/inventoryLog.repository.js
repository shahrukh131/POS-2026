const prisma = require("../../shared/db/prisma");

function create(data, db = prisma) {
  return db.inventoryLog.create({ data });
}

// Newest first. id breaks ties for rows written in the same millisecond.
// `cursor` ({ id, createdAt }) → only rows after it in that order: (createdAt, id) < (cursor.createdAt, cursor.id).
// `type` → only that changeType. Served by the (outlet_id, menu_item_id, created_at) index.
function findByItem(outletId, menuItemId, { limit, cursor = null, type } = {}, db = prisma) {
  const where = { outletId, menuItemId };
  if (type) where.changeType = type;
  if (cursor) {
    where.OR = [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ];
  }
  return db.inventoryLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

// Cursor row for keyset pagination, scoped to the same outlet item.
function findCursor(outletId, menuItemId, id, db = prisma) {
  return db.inventoryLog.findFirst({
    where: { id, outletId, menuItemId },
    select: { id: true, createdAt: true },
  });
}

function createMany(rows, db = prisma) {
  return db.inventoryLog.createMany({ data: rows });
}

module.exports = { create, createMany, findByItem, findCursor };
