import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchInventoryLogs } from '../api/inventoryApi';
import { INVENTORY_LOGS_PAGE_SIZE } from '../constants';

/**
 * Stock movements of one item, loaded page by page (newest first).
 * Each next page asks for logs older than the last loaded one, so it stays fast with thousands of rows.
 * Only fetches while `isEnabled` (the history dialog is open).
 * @param {string} outletId
 * @param {string|number|undefined} menuItemId
 * @param {{ changeType?: string, isEnabled: boolean }} options  `changeType` undefined = all types
 */
export function useInventoryLogsQuery(outletId, menuItemId, { changeType, isEnabled }) {
  return useInfiniteQuery({
    queryKey: queryKeys.inventoryLogs(outletId, menuItemId, changeType),
    queryFn: ({ pageParam }) =>
      fetchInventoryLogs(outletId, menuItemId, {
        limit: INVENTORY_LOGS_PAGE_SIZE,
        before: pageParam,
        changeType,
      }),
    initialPageParam: undefined,
    // A full page means there may be more. The next cursor is the oldest log's id.
    getNextPageParam: (lastPage) =>
      lastPage.length === INVENTORY_LOGS_PAGE_SIZE ? lastPage[lastPage.length - 1].id : undefined,
    enabled: Boolean(isEnabled && outletId && menuItemId != null),
  });
}
