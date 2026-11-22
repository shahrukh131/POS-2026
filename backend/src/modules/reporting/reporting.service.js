const reportingRepository = require("./reporting.repository");
const AppError = require("../../shared/utils/AppError");
const { toMoney } = require("../../shared/utils/money");

// "2026-11-22" → "2026-11-23" (UTC calendar day).
function nextDay(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

// Rule 30: inclusive dates in UTC → half-open range [from 00:00, (to + 1 day) 00:00).
function toRange({ from, to }) {
  return { fromTs: from ?? null, toExclusive: to ? nextDay(to) : null };
}

// Rule 29: every outlet, including ones with no sales ("0.00", 0).
async function revenueByOutlet(query) {
  const rows = await reportingRepository.revenueByOutlet(toRange(query));
  return rows.map((r) => ({
    outletId: r.outletId,
    code: r.code,
    name: r.name,
    totalRevenue: toMoney(r.totalRevenue),
    saleCount: Number(r.saleCount),
  }));
}

// Rule 31: group the flat ranked rows by outlet (SQL already orders by outlet, rank).
async function topItems(query) {
  const rows = await reportingRepository.topItemsByOutlet({
    outletId: query.outletId,
    limit: query.limit,
    ...toRange(query),
  });

  // The query is driven from `outlets`, so an existing outlet always returns ≥ 1 row.
  if (query.outletId && rows.length === 0) {
    throw new AppError(404, "OUTLET_NOT_FOUND", `Outlet ${query.outletId} not found`);
  }

  const byOutlet = new Map();
  for (const r of rows) {
    let entry = byOutlet.get(r.outletId);
    if (!entry) {
      entry = { outletId: r.outletId, code: r.code, items: [] };
      byOutlet.set(r.outletId, entry);
    }
    if (r.menuItemId != null) {
      entry.items.push({
        menuItemId: r.menuItemId,
        name: r.name,
        qtySold: Number(r.qtySold),
        revenue: toMoney(r.revenue),
      });
    }
  }
  return [...byOutlet.values()];
}

module.exports = { revenueByOutlet, topItems };
