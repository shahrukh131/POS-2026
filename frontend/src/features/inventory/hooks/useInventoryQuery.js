import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchOutletInventory } from '../api/inventoryApi';

export function useInventoryQuery(outletId) {
  return useQuery({
    queryKey: queryKeys.inventory(outletId),
    queryFn: () => fetchOutletInventory(outletId),
    enabled: Boolean(outletId),
  });
}
