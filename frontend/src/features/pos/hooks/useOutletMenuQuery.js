import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchOutletMenu } from '../api/posApi';

export function useOutletMenuQuery(outletId) {
  return useQuery({
    queryKey: queryKeys.outletMenu(outletId),
    queryFn: () => fetchOutletMenu(outletId),
    enabled: Boolean(outletId),
  });
}
