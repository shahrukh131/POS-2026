/**
 * Pure calculations behind the Reports page. Money arrives as strings, so everything goes through toAmount().
 */

const toAmount = (numericValue) => Number(numericValue || 0);

/**
 * @typedef {Object} RevenueSummary
 * @property {number} totalRevenue
 * @property {number} totalOrderCount
 * @property {number} averageOrderValue   0 when there are no orders
 * @property {number} activeOutletCount   Outlets with at least one sale
 * @property {number} outletCount
 */

/** @param {import('../api/reportsApi').OutletRevenue[]} revenueRows @returns {RevenueSummary} */
export function summarizeRevenueRows(revenueRows) {
  const totalRevenue = revenueRows.reduce((runningTotal, revenueRow) => runningTotal + toAmount(revenueRow.totalRevenue), 0);
  const totalOrderCount = revenueRows.reduce((runningCount, revenueRow) => runningCount + toAmount(revenueRow.saleCount), 0);
  return {
    totalRevenue,
    totalOrderCount,
    averageOrderValue: totalOrderCount ? totalRevenue / totalOrderCount : 0,
    activeOutletCount: revenueRows.filter((revenueRow) => toAmount(revenueRow.saleCount) > 0).length,
    outletCount: revenueRows.length,
  };
}

/** Percentage change, or null when there is no baseline to compare against. */
export function calculatePercentChange(currentValue, previousValue) {
  if (previousValue == null || previousValue === 0) return null;
  return ((currentValue - previousValue) / previousValue) * 100;
}

/**
 * @typedef {Object} RankedRevenueRow
 * @property {string|number} outletId
 * @property {string} outletCode
 * @property {string} outletName
 * @property {number} rank
 * @property {number} revenueAmount
 * @property {number} orderCount
 * @property {number} revenueSharePercent   Share of all outlets' revenue (sums to 100)
 * @property {number} barWidthPercent       Relative to the top outlet, for the ranked bar
 */

/**
 * Sorted by revenue (highest first), with share of total and bar width.
 * @param {import('../api/reportsApi').OutletRevenue[]} revenueRows
 * @returns {RankedRevenueRow[]}
 */
export function rankRevenueRows(revenueRows) {
  const totalRevenue = revenueRows.reduce((runningTotal, revenueRow) => runningTotal + toAmount(revenueRow.totalRevenue), 0);
  const sortedRevenueRows = [...revenueRows].sort(
    (firstRow, secondRow) => toAmount(secondRow.totalRevenue) - toAmount(firstRow.totalRevenue),
  );
  const highestOutletRevenue = toAmount(sortedRevenueRows[0]?.totalRevenue);

  return sortedRevenueRows.map((revenueRow, rowIndex) => {
    const revenueAmount = toAmount(revenueRow.totalRevenue);
    return {
      outletId: revenueRow.outletId,
      outletCode: revenueRow.code,
      outletName: revenueRow.name,
      rank: rowIndex + 1,
      revenueAmount,
      orderCount: toAmount(revenueRow.saleCount),
      revenueSharePercent: totalRevenue ? (revenueAmount / totalRevenue) * 100 : 0,
      barWidthPercent: highestOutletRevenue ? (revenueAmount / highestOutletRevenue) * 100 : 0,
    };
  });
}

const percentFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

/** 46.234 → "46.2%" */
export const formatPercent = (percentValue) => `${percentFormatter.format(percentValue)}%`;
