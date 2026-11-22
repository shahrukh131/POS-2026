const { Prisma } = require("@prisma/client");
const prisma = require("../../shared/db/prisma");

// created_at is TIMESTAMP(3) holding UTC, so bounds are passed as 'YYYY-MM-DD' and cast to timestamp.
// Half-open range [fromTs, toExclusive). Fragments stay parameterized (no string concatenation).
function dateFilter(column, { fromTs, toExclusive }) {
  return Prisma.sql`${fromTs ? Prisma.sql`AND ${column} >= ${fromTs}::timestamp` : Prisma.empty}
    ${toExclusive ? Prisma.sql`AND ${column} < ${toExclusive}::timestamp` : Prisma.empty}`;
}

const salesCreatedAt = Prisma.raw("s.created_at");

// Rule 29: one row per outlet (LEFT JOIN keeps outlets with no sales). The date filter is in
// the ON clause, not WHERE, so it doesn't drop those outlets. numeric → Prisma Decimal.
function revenueByOutlet(range, db = prisma) {
  return db.$queryRaw`
    SELECT o.id   AS "outletId",
           o.code,
           o.name,
           COALESCE(SUM(s.total_amount), 0) AS "totalRevenue",
           COUNT(s.id)::int                 AS "saleCount"
    FROM outlets o
    LEFT JOIN sales s ON s.outlet_id = o.id ${dateFilter(salesCreatedAt, range)}
    GROUP BY o.id
    ORDER BY "totalRevenue" DESC, o.id ASC`;
}

// Rule 31: top `limit` items per outlet by qty, ties → revenue desc, name asc (id = final tiebreak).
// Flat rows ordered by outlet then rank. An outlet with no sales yields one row with null item fields.
function topItemsByOutlet({ outletId, limit, ...range }, db = prisma) {
  const saleOutlet = outletId ? Prisma.sql`AND s.outlet_id = ${outletId}` : Prisma.empty;
  const outletFilter = outletId ? Prisma.sql`AND o.id = ${outletId}` : Prisma.empty;

  return db.$queryRaw`
    WITH item_totals AS (
      SELECT s.outlet_id,
             si.menu_item_id,
             SUM(si.quantity)::bigint AS qty_sold,
             SUM(si.line_total)       AS revenue
      FROM sales s
      JOIN sale_items si ON si.sale_id = s.id
      WHERE TRUE ${saleOutlet} ${dateFilter(salesCreatedAt, range)}
      GROUP BY s.outlet_id, si.menu_item_id
    ), ranked AS (
      SELECT it.outlet_id, it.menu_item_id, it.qty_sold, it.revenue, mi.name,
             ROW_NUMBER() OVER (
               PARTITION BY it.outlet_id
               ORDER BY it.qty_sold DESC, it.revenue DESC, mi.name ASC, mi.id ASC
             ) AS rn
      FROM item_totals it
      JOIN menu_items mi ON mi.id = it.menu_item_id
    )
    SELECT o.id            AS "outletId",
           o.code,
           r.menu_item_id  AS "menuItemId",
           r.name,
           r.qty_sold      AS "qtySold",
           r.revenue
    FROM outlets o
    LEFT JOIN ranked r ON r.outlet_id = o.id AND r.rn <= ${limit}
    WHERE TRUE ${outletFilter}
    ORDER BY o.id ASC, r.rn ASC`;
}

module.exports = { revenueByOutlet, topItemsByOutlet };
