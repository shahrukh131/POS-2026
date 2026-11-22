/**
 * Mappers shared by several features. They turn whatever the backend returns
 * into the shape the UI uses — adjust field names here if the API changes.
 */

/** Accepts a bare array or `{ items }` / `{ rows }` wrappers. */
export const extractList = (responseData) =>
  Array.isArray(responseData) ? responseData : responseData?.items ?? responseData?.rows ?? [];

/**
 * @typedef {Object} OutletMenuItem
 * @property {string|number} menuItemId
 * @property {string} name
 * @property {string} category
 * @property {string|null} basePrice
 * @property {string|null} priceOverride
 * @property {string} price           Effective selling price at this outlet
 * @property {boolean} isAvailable
 * @property {number|null} stock      null when the backend does not track stock for the row
 * @property {string|undefined} updatedAt
 */

/**
 * One row of an outlet's menu (used by assignments, inventory and POS).
 * Handles both flat rows and rows with a nested `menuItem`.
 * @returns {OutletMenuItem}
 */
export function mapOutletMenuItemFromApi(apiRow) {
  const nestedMenuItem = apiRow.menuItem || {};
  const rawStock =
    apiRow.stock ??
    apiRow.quantity ??
    apiRow.qty ??
    apiRow.inventory?.quantity ??
    apiRow.inventory?.stock ??
    null;

  return {
    menuItemId: apiRow.menuItemId ?? nestedMenuItem.id ?? apiRow.id,
    name: apiRow.name ?? nestedMenuItem.name ?? '',
    category: apiRow.category ?? nestedMenuItem.category ?? '',
    basePrice: apiRow.basePrice ?? nestedMenuItem.basePrice ?? null,
    priceOverride: apiRow.priceOverride ?? null,
    price:
      apiRow.effectivePrice ??
      apiRow.price ??
      apiRow.priceOverride ??
      nestedMenuItem.basePrice ??
      apiRow.basePrice ??
      '0.00',
    isAvailable: apiRow.isAvailable ?? apiRow.available ?? true,
    stock: rawStock == null ? null : Number(rawStock),
    updatedAt: apiRow.updatedAt ?? apiRow.inventory?.updatedAt,
  };
}
