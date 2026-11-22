import { useMemo } from 'react';
import { getPreviousDateRange } from '../utils/reportDateRange';
import { rankRevenueRows, summarizeRevenueRows } from '../utils/reportMetrics';
import { useRevenueByOutletQuery } from './useRevenueByOutletQuery';
import { useTopItemsQuery } from './useTopItemsQuery';

/**
 * Everything the Reports page shows for one date range: the current period,
 * the equally long previous period (for KPI deltas, skipped for "All time") and the top items.
 *
 * @param {import('../api/reportsApi').ReportDateRange} dateRange
 */
export function useReportData(dateRange) {
  const previousDateRange = useMemo(() => getPreviousDateRange(dateRange), [dateRange]);

  const revenueByOutletQuery = useRevenueByOutletQuery(dateRange);
  const previousRevenueByOutletQuery = useRevenueByOutletQuery(previousDateRange);
  const topItemsQuery = useTopItemsQuery(dateRange);

  const revenueRows = revenueByOutletQuery.data;
  const previousRevenueRows = previousRevenueByOutletQuery.data;

  const rankedRevenueRows = useMemo(() => rankRevenueRows(revenueRows ?? []), [revenueRows]);
  const currentSummary = useMemo(() => summarizeRevenueRows(revenueRows ?? []), [revenueRows]);
  // null until the baseline has loaded (or when there is no previous period, as with "All time")
  // — the KPI tiles then show no delta rather than a wrong one.
  const previousSummary = useMemo(
    () => (previousRevenueRows ? summarizeRevenueRows(previousRevenueRows) : null),
    [previousRevenueRows],
  );

  /** Top-items rows may omit outlet names, so join them from the revenue report. */
  const outletDetailsById = useMemo(
    () =>
      new Map(
        rankedRevenueRows.map((rankedRow) => [
          String(rankedRow.outletId),
          { outletName: rankedRow.outletName, revenueAmount: rankedRow.revenueAmount },
        ]),
      ),
    [rankedRevenueRows],
  );

  const reportQueries = [revenueByOutletQuery, topItemsQuery];
  if (previousDateRange) reportQueries.push(previousRevenueByOutletQuery);

  const hasComparisonPeriod = previousDateRange !== null;

  return {
    previousDateRange,
    hasComparisonPeriod,
    /** False when the period has no orders — the backend still returns every outlet, with 0 revenue. */
    hasAnySales: currentSummary.totalOrderCount > 0,
    revenueByOutletQuery,
    topItemsQuery,
    rankedRevenueRows,
    currentSummary,
    previousSummary,
    isComparisonLoading: previousRevenueByOutletQuery.isLoading,
    topItemsByOutlet: topItemsQuery.data ?? [],
    outletDetailsById,
    isFetchingAnyReport: reportQueries.some((reportQuery) => reportQuery.isFetching),
    refetchAllReports: () => Promise.all(reportQueries.map((reportQuery) => reportQuery.refetch())),
  };
}
