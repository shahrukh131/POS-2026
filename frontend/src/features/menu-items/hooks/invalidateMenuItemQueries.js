import { QUERY_KEY_ROOTS, queryKeys } from '@/lib/api/queryKeys';

/** Menu item changes affect the master list and every outlet's assignment table. */
export const invalidateMenuItemQueries = (queryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.menuItems }),
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ROOTS.OUTLET_ASSIGNMENTS] }),
  ]);
