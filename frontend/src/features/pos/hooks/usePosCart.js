import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { exceedsAvailableStock } from '../utils/menuItemAvailability';

/**
 * Cart state for the POS screen. Increases are capped at the outlet's current stock.
 * Lines whose item disappears from the menu (e.g. after a refetch) are dropped automatically,
 * and lines left above a lower, refetched stock are flagged with `exceedsStock`.
 *
 * @param {import('@/lib/api/responseMappers').OutletMenuItem[]} outletMenuItems
 */
export function usePosCart(outletMenuItems) {
  /** @type {[Record<string, number>, Function]} */
  const [cartQuantitiesByMenuItemId, setCartQuantitiesByMenuItemId] = useState({});

  const menuItemsById = useMemo(
    () => new Map(outletMenuItems.map((menuItem) => [String(menuItem.menuItemId), menuItem])),
    [outletMenuItems],
  );

  /** @type {import('../api/saleReceiptMapper').CartLine[]} */
  const cartLines = useMemo(
    () =>
      Object.entries(cartQuantitiesByMenuItemId)
        .map(([menuItemId, quantity]) => ({ menuItem: menuItemsById.get(menuItemId), quantity }))
        .filter((cartLine) => cartLine.menuItem)
        .map((cartLine) => ({
          ...cartLine,
          lineTotal: Number(cartLine.menuItem.price) * cartLine.quantity,
          exceedsStock: exceedsAvailableStock(cartLine.menuItem, cartLine.quantity),
        })),
    [cartQuantitiesByMenuItemId, menuItemsById],
  );

  const cartTotal = cartLines.reduce((runningTotal, cartLine) => runningTotal + cartLine.lineTotal, 0);
  const itemCount = cartLines.reduce((runningCount, cartLine) => runningCount + cartLine.quantity, 0);

  const getCartQuantity = useCallback(
    (menuItemId) => cartQuantitiesByMenuItemId[String(menuItemId)] ?? 0,
    [cartQuantitiesByMenuItemId],
  );

  const setCartLineQuantity = useCallback(
    (menuItemId, nextQuantity) => {
      const cartKey = String(menuItemId);
      const menuItem = menuItemsById.get(cartKey);
      const isIncreasingQuantity = nextQuantity > (cartQuantitiesByMenuItemId[cartKey] ?? 0);
      // Only block increases, so the cashier can still reduce a line after stock dropped on refetch.
      if (menuItem && isIncreasingQuantity && exceedsAvailableStock(menuItem, nextQuantity)) {
        toast.error(`Only ${menuItem.stock} ${menuItem.name} left`);
        return;
      }
      setCartQuantitiesByMenuItemId((previousQuantities) => {
        const { [cartKey]: _removedQuantity, ...remainingQuantities } = previousQuantities;
        return nextQuantity > 0 ? { ...remainingQuantities, [cartKey]: nextQuantity } : remainingQuantities;
      });
    },
    [menuItemsById, cartQuantitiesByMenuItemId],
  );

  const addMenuItemToCart = useCallback(
    (menuItem) => setCartLineQuantity(menuItem.menuItemId, getCartQuantity(menuItem.menuItemId) + 1),
    [setCartLineQuantity, getCartQuantity],
  );

  const removeCartLine = useCallback((menuItemId) => setCartLineQuantity(menuItemId, 0), [setCartLineQuantity]);

  const clearCart = useCallback(() => setCartQuantitiesByMenuItemId({}), []);

  return {
    cartLines,
    cartTotal,
    itemCount,
    hasCartLines: cartLines.length > 0,
    /** True when any line is above the latest stock — the sale would be rejected with 409. */
    hasStockProblems: cartLines.some((cartLine) => cartLine.exceedsStock),
    getCartQuantity,
    addMenuItemToCart,
    setCartLineQuantity,
    removeCartLine,
    clearCart,
  };
}
