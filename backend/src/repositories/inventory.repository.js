const prisma = require("../config/prisma");

const key = (outletId, menuItemId) => ({ outletId_menuItemId: { outletId, menuItemId } });

function create(data, db = prisma) {
  return db.inventory.create({ data });
}

function findByKey(outletId, menuItemId, db = prisma) {
  return db.inventory.findUnique({ where: key(outletId, menuItemId) });
}

// One query with joins (no N+1), including unavailable assignments.
function findAllByOutlet(outletId, db = prisma) {
  return db.inventory.findMany({
    where: { outletId },
    include: { outletMenuItem: { include: { menuItem: true } } },
    orderBy: { menuItemId: "asc" },
  });
}

// Atomic UPDATE ... SET quantity = quantity + q RETURNING *. Throws P2025 if the row is missing.
function increment(outletId, menuItemId, quantity, db = prisma) {
  return db.inventory.update({
    where: key(outletId, menuItemId),
    data: { quantity: { increment: quantity } },
  });
}

// Row lock held until the transaction ends. Returns the locked row or null.
async function lockForUpdate(outletId, menuItemId, db = prisma) {
  const rows = await db.$queryRaw`
    SELECT quantity FROM inventory
    WHERE outlet_id = ${outletId} AND menu_item_id = ${menuItemId}
    FOR UPDATE`;
  return rows[0] ?? null;
}

function setQuantity(outletId, menuItemId, quantity, db = prisma) {
  return db.inventory.update({ where: key(outletId, menuItemId), data: { quantity } });
}

// Sale deduction (rule 20): conditional atomic decrement. Returns the number of rows changed:
// 0 = not enough stock (or no row) → caller throws 409. The UPDATE locks the row until commit.
async function deduct(outletId, menuItemId, quantity, db = prisma) {
  const { count } = await db.inventory.updateMany({
    where: { outletId, menuItemId, quantity: { gte: quantity } },
    data: { quantity: { decrement: quantity } },
  });
  return count;
}

module.exports = { create, findByKey, findAllByOutlet, increment, lockForUpdate, setQuantity, deduct };
