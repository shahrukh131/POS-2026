import { httpGet, httpPatch, httpPost } from '@/lib/api/httpClient';
import { extractList, mapOutletMenuItemFromApi } from '@/lib/api/responseMappers';

// Lines marked ASSUMED are guesses about the backend routes — verify them against the Express app.

/**
 * @typedef {Object} AssignmentPayload
 * @property {string|null} priceOverride   Money string, or null to use the base price
 * @property {boolean} isAvailable
 */

/** Menu items currently assigned to an outlet. */
export async function fetchOutletAssignments(outletId) {
  const responseData = await httpGet(`/api/hq/outlets/${outletId}/menu-items`); // ASSUMED
  return extractList(responseData).map(mapOutletMenuItemFromApi);
}

/** @param {string} outletId @param {{ menuItemId: string } & AssignmentPayload} assignMenuItemPayload */
export const assignMenuItemToOutlet = (outletId, assignMenuItemPayload) =>
  httpPost(`/api/hq/outlets/${outletId}/menu-items`, assignMenuItemPayload); // ASSUMED

/** @param {string} outletId @param {string} menuItemId @param {AssignmentPayload} assignmentPayload */
export const updateOutletAssignment = (outletId, menuItemId, assignmentPayload) =>
  httpPatch(`/api/hq/outlets/${outletId}/menu-items/${menuItemId}`, assignmentPayload); // ASSUMED
