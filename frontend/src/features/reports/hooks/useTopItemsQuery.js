import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchTopItemsByOutlet } from '../api/reportsApi';
import { TOP_ITEMS_LIMIT } from '../constants';

/** @param {import('../api/reportsApi').ReportDateRange} dateRange */
export function useTopItemsQuery(dateRange) {
  const topItemsParams = { ...dateRange, limit: TOP_ITEMS_LIMIT };
  return useQuery({
    queryKey: queryKeys.topItems(topItemsParams),
    queryFn: () => fetchTopItemsByOutlet(topItemsParams),
  });
}
