import { buildQueryString, httpGet, httpPost, httpPut } from '@/lib/api/httpClient';
import { extractList, mapOutletMenuItemFromApi } from '@/lib/api/responseMappers';

/** Stock rows for every item assigned to the outlet. */
export async function fetchOutletInventory(outletId) {
  const responseData = await httpGet(`/api/hq/outlets/${outletId}/inventory`);
  return extractList(responseData).map(mapOutletMenuItemFromApi);
}

/** Adds stock (delivery). `quantity` must be a positive integer. */
export const restockInventoryItem = (outletId, menuItemId, { quantity, note }) =>
  httpPost(`/api/hq/outlets/${outletId}/inventory/${menuItemId}/restock`, { quantity, note });

/** Sets stock to an absolute `quantity` (≥ 0). The backend logs the difference as an ADJUSTMENT. */
export const adjustInventoryItem = (outletId, menuItemId, { quantity, note }) =>
  httpPut(`/api/hq/outlets/${outletId}/inventory/${menuItemId}`, { quantity, note });

/**
 * @typedef {Object} InventoryLog
 * @property {number} id
 * @property {'RESTOCK' | 'SALE' | 'ADJUSTMENT'} changeType
 * @property {number} quantityChange  e.g. +100 or -2
 * @property {number} balanceAfter
 * @property {number|null} saleId
 * @property {string|null} note
 * @property {string} createdAt
 */

/**
 * One page of an item's stock movement history, newest first.
 * `before` = id of the oldest log already loaded (keyset pagination). `changeType` filters by type.
 * @returns {Promise<InventoryLog[]>}
 */
export async function fetchInventoryLogs(outletId, menuItemId, { limit, before, changeType }) {
  const queryString = buildQueryString({ limit, before, type: changeType });
  const responseData = await httpGet(`/api/hq/outlets/${outletId}/inventory/${menuItemId}/logs${queryString}`);
  return extractList(responseData);
}
