import { httpGet, httpPatch, httpPost } from '@/lib/api/httpClient';
import { extractList } from '@/lib/api/responseMappers';
import { mapOutletFromApi } from './outletMappers';

// Matches backend/src/modules/outlet (outlet.validator.js). Bodies are strict: unknown fields are rejected.

/** @returns {Promise<import('./outletMappers').Outlet[]>} */
export async function fetchOutlets() {
  const responseData = await httpGet('/api/hq/outlets');
  return extractList(responseData).map(mapOutletFromApi);
}

/** @param {{ code: string, name: string, location?: string }} createOutletPayload */
export const createOutlet = (createOutletPayload) => httpPost('/api/hq/outlets', createOutletPayload);

/**
 * The outlet code cannot be changed (it is printed on existing receipts).
 * @param {string} outletId
 * @param {{ name: string, location: string | null }} updateOutletPayload   `location: null` clears it
 */
export const updateOutlet = (outletId, updateOutletPayload) =>
  httpPatch(`/api/hq/outlets/${outletId}`, updateOutletPayload);
