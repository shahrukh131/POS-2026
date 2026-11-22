import { httpGet, httpPatch, httpPost } from '@/lib/api/httpClient';
import { extractList } from '@/lib/api/responseMappers';
import { mapMenuItemFromApi } from './menuItemMappers';

// Lines marked ASSUMED are guesses about the backend routes — verify them against the Express app.

/**
 * @typedef {Object} MenuItemPayload
 * @property {string} [name]
 * @property {string} [sku]
 * @property {string} [category]
 * @property {string} [basePrice]
 * @property {boolean} [isActive]
 */

/** @returns {Promise<import('./menuItemMappers').MenuItem[]>} */
export async function fetchMenuItems() {
  const responseData = await httpGet('/api/hq/menu-items'); // ASSUMED
  return extractList(responseData).map(mapMenuItemFromApi);
}

/** @param {MenuItemPayload} menuItemPayload */
export const createMenuItem = (menuItemPayload) =>
  httpPost('/api/hq/menu-items', menuItemPayload); // ASSUMED

/** @param {string} menuItemId @param {MenuItemPayload} menuItemPayload */
export const updateMenuItem = (menuItemId, menuItemPayload) =>
  httpPatch(`/api/hq/menu-items/${menuItemId}`, menuItemPayload); // ASSUMED
