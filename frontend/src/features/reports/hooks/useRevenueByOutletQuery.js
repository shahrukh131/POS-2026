import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchRevenueByOutlet } from '../api/reportsApi';
import { REPORT_REFETCH_INTERVAL_IN_MS } from '../constants';

/**
 * Live updates come from useLiveReports (SSE). Focus refetch + polling are the fallback.
 * @param {import('../api/reportsApi').ReportDateRange | null} dateRange   null disables the query
 */
export function useRevenueByOutletQuery(dateRange) {
  return useQuery({
    queryKey: queryKeys.revenueReport(dateRange),
    queryFn: () => fetchRevenueByOutlet(dateRange),
    enabled: Boolean(dateRange),
    refetchOnWindowFocus: true,
    refetchInterval: REPORT_REFETCH_INTERVAL_IN_MS,
  });
}
