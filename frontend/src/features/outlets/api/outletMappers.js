/**
 * @typedef {Object} Outlet
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} address
 * @property {string|undefined} createdAt
 */

/** @returns {Outlet} */
export const mapOutletFromApi = (apiOutlet) => ({
  id: String(apiOutlet.id ?? apiOutlet.outletId),
  code: apiOutlet.code,
  name: apiOutlet.name,
  address: apiOutlet.address ?? apiOutlet.location ?? '',
  createdAt: apiOutlet.createdAt,
});
