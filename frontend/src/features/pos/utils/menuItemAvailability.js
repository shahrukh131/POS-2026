import { LOW_STOCK_THRESHOLD } from '@/config/inventoryRules';

/** @typedef {import('@/lib/api/responseMappers').OutletMenuItem} OutletMenuItem */

/** `stock === null` means the backend does not track stock for the item, so it is never capped. */
export const isStockTracked = (menuItem) => menuItem.stock != null;

/** @param {OutletMenuItem} menuItem */
export const canSellMenuItem = (menuItem) =>
  menuItem.isAvailable && (!isStockTracked(menuItem) || menuItem.stock > 0);

/** @param {OutletMenuItem} menuItem */
export const isLowStock = (menuItem) => isStockTracked(menuItem) && menuItem.stock <= LOW_STOCK_THRESHOLD;

/** True when `requestedQuantity` is more than the outlet has in stock. */
export const exceedsAvailableStock = (menuItem, requestedQuantity) =>
  isStockTracked(menuItem) && requestedQuantity > menuItem.stock;

/** Short label for a POS tile. Empty when stock is not tracked. */
export function getStockLabel(menuItem) {
  if (!menuItem.isAvailable) return 'Unavailable';
  if (!isStockTracked(menuItem)) return '';
  if (menuItem.stock <= 0) return 'Out of stock';
  return `${menuItem.stock} in stock`;
}
