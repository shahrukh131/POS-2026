import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchTopItemsByOutlet } from '../api/reportsApi';
import { REPORT_REFETCH_INTERVAL_IN_MS, TOP_ITEMS_LIMIT } from '../constants';

/**
 * Live updates come from useLiveReports (SSE). Focus refetch + polling are the fallback.
 * @param {import('../api/reportsApi').ReportDateRange} dateRange
 */
export function useTopItemsQuery(dateRange) {
  const topItemsParams = { ...dateRange, limit: TOP_ITEMS_LIMIT };
  return useQuery({
    queryKey: queryKeys.topItems(topItemsParams),
    queryFn: () => fetchTopItemsByOutlet(topItemsParams),
    refetchOnWindowFocus: true,
    refetchInterval: REPORT_REFETCH_INTERVAL_IN_MS,
  });
}
