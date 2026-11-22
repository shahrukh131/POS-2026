import { httpGet, httpPost } from '@/lib/api/httpClient';
import { extractList, mapOutletMenuItemFromApi } from '@/lib/api/responseMappers';

/** The outlet's sellable menu with effective prices and stock. */
export async function fetchOutletMenu(outletId) {
  const responseData = await httpGet(`/api/outlets/${outletId}/menu`);
  return extractList(responseData).map(mapOutletMenuItemFromApi);
}

/**
 * Records a sale. `clientId` is the idempotency key: resending the same id must not create a second sale.
 * @param {string} outletId
 * @param {{ clientId: string, items: { menuItemId: string|number, quantity: number }[] }} createSalePayload
 */
export const createSale = (outletId, createSalePayload) =>
  httpPost(`/api/outlets/${outletId}/sales`, createSalePayload);
