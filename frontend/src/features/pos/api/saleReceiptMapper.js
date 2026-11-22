import { EMPTY_VALUE_PLACEHOLDER, toMoneyString } from '@/lib/formatters';

/**
 * @typedef {Object} CartLine
 * @property {import('@/lib/api/responseMappers').OutletMenuItem} menuItem
 * @property {number} quantity
 * @property {number} lineTotal
 * @property {boolean} exceedsStock   Quantity is above the outlet's latest known stock
 *
 * @typedef {Object} ReceiptLine
 * @property {string|number} menuItemId
 * @property {string} name
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} lineTotal
 *
 * @typedef {Object} SaleReceipt
 * @property {string} receiptNumber   e.g. "DHA-000001"
 * @property {string} totalAmount     Money string
 * @property {ReceiptLine[]} soldLines
 * @property {string} soldAt          ISO timestamp
 */

/** @param {CartLine} cartLine @returns {ReceiptLine} */
const toReceiptLineFromCart = (cartLine) => ({
  menuItemId: cartLine.menuItem.menuItemId,
  name: cartLine.menuItem.name,
  quantity: cartLine.quantity,
  unitPrice: Number(cartLine.menuItem.price),
  lineTotal: cartLine.lineTotal,
});

/** @returns {ReceiptLine} */
function toReceiptLineFromApi(apiSaleItem) {
  const quantity = Number(apiSaleItem.quantity);
  const lineTotal = Number(apiSaleItem.lineTotal ?? Number(apiSaleItem.unitPrice) * quantity);
  return {
    menuItemId: apiSaleItem.menuItemId,
    name: apiSaleItem.name,
    quantity,
    unitPrice: Number(apiSaleItem.unitPrice ?? lineTotal / quantity),
    lineTotal,
  };
}

/**
 * Builds the receipt from the SERVER's sale — it holds the real prices, and on an idempotent replay
 * (same clientId re-sent) it is the sale that was actually recorded, which may differ from the cart.
 * The cart is only a fallback for responses without `items`.
 *
 * @param {unknown} createSaleResponse
 * @param {CartLine[]} submittedCartLines
 * @returns {SaleReceipt}
 */
export function mapSaleReceiptFromApi(createSaleResponse, submittedCartLines) {
  const sale = createSaleResponse?.sale ?? createSaleResponse;
  const hasServerItems = Array.isArray(sale?.items) && sale.items.length > 0;
  const soldLines = hasServerItems
    ? sale.items.map(toReceiptLineFromApi)
    : submittedCartLines.map(toReceiptLineFromCart);
  const soldLinesTotal = soldLines.reduce((runningTotal, soldLine) => runningTotal + soldLine.lineTotal, 0);

  return {
    receiptNumber: sale?.receiptNumber ?? sale?.receiptNo ?? sale?.receipt ?? EMPTY_VALUE_PLACEHOLDER,
    totalAmount: sale?.totalAmount ?? sale?.total ?? toMoneyString(soldLinesTotal),
    soldLines,
    soldAt: sale?.createdAt ?? new Date().toISOString(),
  };
}
