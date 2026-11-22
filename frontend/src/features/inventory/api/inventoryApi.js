import { httpGet, httpPost } from '@/lib/api/httpClient';
import { extractList, mapOutletMenuItemFromApi } from '@/lib/api/responseMappers';

// Lines marked ASSUMED are guesses about the backend routes — verify them against the Express app.

/** Stock rows for every item assigned to the outlet. */
export async function fetchOutletInventory(outletId) {
  const responseData = await httpGet(`/api/hq/outlets/${outletId}/inventory`); // ASSUMED
  return extractList(responseData).map(mapOutletMenuItemFromApi);
}

/** Adds stock (delivery). `quantity` must be a positive integer. */
export const restockInventoryItem = (outletId, menuItemId, { quantity, note }) =>
  httpPost(`/api/hq/outlets/${outletId}/inventory/${menuItemId}/restock`, { quantity, note }); // ASSUMED

/** Corrects stock up or down (waste, damage, recount). `delta` is a non-zero integer. */
export const adjustInventoryItem = (outletId, menuItemId, { delta, reason }) =>
  httpPost(`/api/hq/outlets/${outletId}/inventory/${menuItemId}/adjust`, { delta, reason }); // ASSUMED
