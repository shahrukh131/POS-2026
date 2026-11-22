import { isAllTimeRange } from './reportDateRange';

/**
 * Two sections in one sheet: revenue by outlet, then top items per outlet.
 * Amounts are plain numbers (no ৳ sign) so spreadsheets can sum them.
 *
 * @param {{
 *   dateRange: import('../api/reportsApi').ReportDateRange,
 *   rankedRevenueRows: import('./reportMetrics').RankedRevenueRow[],
 *   topItemsByOutlet: import('../api/reportsApi').OutletTopItems[],
 *   outletDetailsById: Map<string, { outletName: string }>,
 * }} reportData
 */
export function buildRevenueReportCsv({ dateRange, rankedRevenueRows, topItemsByOutlet, outletDetailsById }) {
  const revenueSection = [
    ['Revenue by outlet', isAllTimeRange(dateRange) ? 'All time' : `${dateRange.fromDate} to ${dateRange.toDate}`],
    ['Rank', 'Outlet code', 'Outlet name', 'Orders', 'Revenue (BDT)', 'Share of revenue (%)'],
    ...rankedRevenueRows.map((rankedRow) => [
      rankedRow.rank,
      rankedRow.outletCode,
      rankedRow.outletName,
      rankedRow.orderCount,
      rankedRow.revenueAmount.toFixed(2),
      rankedRow.revenueSharePercent.toFixed(1),
    ]),
  ];

  const topItemsSection = [
    ['Top items per outlet'],
    ['Outlet code', 'Outlet name', 'Rank', 'Item', 'Quantity sold', 'Revenue (BDT)'],
    ...topItemsByOutlet.flatMap((outletTopItems) =>
      (outletTopItems.items ?? []).map((topSellingItem, itemIndex) => [
        outletTopItems.code,
        outletTopItems.name ?? outletDetailsById.get(String(outletTopItems.outletId))?.outletName ?? '',
        itemIndex + 1,
        topSellingItem.name,
        topSellingItem.qtySold,
        Number(topSellingItem.revenue || 0).toFixed(2),
      ]),
    ),
  ];

  return [...revenueSection, [], ...topItemsSection];
}

export const buildRevenueReportFileName = (dateRange) =>
  isAllTimeRange(dateRange)
    ? 'revenue-report_all-time.csv'
    : `revenue-report_${dateRange.fromDate}_${dateRange.toDate}.csv`;
