import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchRevenueByOutlet } from '../api/reportsApi';

/**
 * @param {import('../api/reportsApi').ReportDateRange | null} dateRange   null disables the query
 */
export function useRevenueByOutletQuery(dateRange) {
  return useQuery({
    queryKey: queryKeys.revenueReport(dateRange),
    queryFn: () => fetchRevenueByOutlet(dateRange),
    enabled: Boolean(dateRange),
  });
}
