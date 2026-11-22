import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { adjustInventoryItem, restockInventoryItem } from '../api/inventoryApi';
import { STOCK_CHANGE_TYPES } from '../constants';

/** Restocks or adjusts one inventory row at the outlet. */
export function useStockChangeMutation(outletId) {
  const queryClient = useQueryClient();
  return useMutation({
    /**
     * @param {{ changeType: 'restock' | 'adjust', menuItemId: string, quantityChange: number, note: string }} variables
     */
    mutationFn: ({ changeType, menuItemId, quantityChange, note }) =>
      changeType === STOCK_CHANGE_TYPES.RESTOCK
        ? restockInventoryItem(outletId, menuItemId, { quantity: quantityChange, note: note || undefined })
        : adjustInventoryItem(outletId, menuItemId, { delta: quantityChange, reason: note }),
    // Stock levels are shown both here and on the outlet's POS screen.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory(outletId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.outletMenu(outletId) }),
      ]),
  });
}
