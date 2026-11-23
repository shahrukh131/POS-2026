import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { adjustInventoryItem, restockInventoryItem } from '../api/inventoryApi';
import { STOCK_CHANGE_TYPES } from '../constants';

/** Restocks or adjusts one inventory row at the outlet. */
export function useStockChangeMutation(outletId) {
  const queryClient = useQueryClient();
  return useMutation({
    /**
     * Restock sends the amount to add. Adjust sends the new absolute stock (the backend logs new − old).
     * @param {{ changeType: 'restock' | 'adjust', menuItemId: string, quantityChange: number, stockAfterChange: number, note: string }} variables
     */
    mutationFn: ({ changeType, menuItemId, quantityChange, stockAfterChange, note }) =>
      changeType === STOCK_CHANGE_TYPES.RESTOCK
        ? restockInventoryItem(outletId, menuItemId, { quantity: quantityChange, note: note || undefined })
        : adjustInventoryItem(outletId, menuItemId, { quantity: stockAfterChange, note: note || undefined }),
    // Stock levels are shown here, in the stock history and on the outlet's POS screen.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory(outletId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryLogs(outletId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.outletMenu(outletId) }),
      ]),
  });
}
