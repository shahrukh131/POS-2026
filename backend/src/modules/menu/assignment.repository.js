const prisma = require("../../shared/db/prisma");

const withItemAndStock = { menuItem: true, inventory: true };

const key = (outletId, menuItemId) => ({ outletId_menuItemId: { outletId, menuItemId } });

function create(data, db = prisma) {
  return db.outletMenuItem.create({ data });
}

function findByKey(outletId, menuItemId, db = prisma) {
  return db.outletMenuItem.findUnique({ where: key(outletId, menuItemId), include: withItemAndStock });
}

// One query with joins (no N+1). Includes unavailable assignments (HQ view).
function findAllByOutlet(outletId, db = prisma) {
  return db.outletMenuItem.findMany({
    where: { outletId },
    include: withItemAndStock,
    orderBy: { menuItemId: "asc" },
  });
}

function update(outletId, menuItemId, data, db = prisma) {
  return db.outletMenuItem.update({ where: key(outletId, menuItemId), data, include: withItemAndStock });
}

// Outlet-facing menu (rules 8–9) in ONE statement / round trip: assigned + available + active,
// with stock. Parameterized tagged template (no string concatenation). numeric → Prisma Decimal.
function findSellableByOutlet(outletId, db = prisma) {
  return db.$queryRaw`
    SELECT mi.id              AS "menuItemId",
           mi.sku,
           mi.name,
           omi.price_override AS "priceOverride",
           mi.base_price      AS "basePrice",
           COALESCE(inv.quantity, 0) AS stock
    FROM outlet_menu_items omi
    JOIN menu_items mi      ON mi.id = omi.menu_item_id
    LEFT JOIN inventory inv ON inv.outlet_id = omi.outlet_id AND inv.menu_item_id = omi.menu_item_id
    WHERE omi.outlet_id = ${outletId}
      AND omi.is_available = true
      AND mi.is_active = true
    ORDER BY mi.name ASC, mi.id ASC`;
}

// Sale validation: the requested items' assignments (with master item) in one query.
function findManyForSale(outletId, menuItemIds, db = prisma) {
  return db.outletMenuItem.findMany({
    where: { outletId, menuItemId: { in: menuItemIds } },
    include: { menuItem: true },
  });
}

module.exports = { create, findByKey, findAllByOutlet, update, findSellableByOutlet, findManyForSale };
