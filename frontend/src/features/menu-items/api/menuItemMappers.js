/**
 * @typedef {Object} MenuItem
 * @property {string} id
 * @property {string} name
 * @property {string} sku
 * @property {string} category
 * @property {string} basePrice   Money string, e.g. "250.00"
 * @property {boolean} isActive
 */

/** @returns {MenuItem} */
export const mapMenuItemFromApi = (apiMenuItem) => ({
  id: String(apiMenuItem.id ?? apiMenuItem.menuItemId),
  name: apiMenuItem.name,
  sku: apiMenuItem.sku ?? '',
  category: apiMenuItem.category ?? '',
  basePrice: apiMenuItem.basePrice ?? apiMenuItem.price ?? '0.00',
  isActive: apiMenuItem.isActive ?? apiMenuItem.active ?? true,
});
