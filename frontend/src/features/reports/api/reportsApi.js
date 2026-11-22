import { buildQueryString, httpGet } from '@/lib/api/httpClient';
import { extractList } from '@/lib/api/responseMappers';

/**
 * @typedef {{ fromDate: string, toDate: string }} ReportDateRange   ISO dates, e.g. "2026-11-01"
 *
 * @typedef {Object} OutletRevenue
 * @property {string|number} outletId
 * @property {string} code
 * @property {string} name
 * @property {string} totalRevenue   Money string
 * @property {number} saleCount
 *
 * @typedef {Object} TopSellingItem
 * @property {string|number} menuItemId
 * @property {string} name
 * @property {number} qtySold
 * @property {string} revenue        Money string
 *
 * @typedef {{ outletId: string|number, code: string, name?: string, items: TopSellingItem[] }} OutletTopItems
 */

/** @param {ReportDateRange} dateRange @returns {Promise<OutletRevenue[]>} */
export async function fetchRevenueByOutlet({ fromDate, toDate }) {
  const queryString = buildQueryString({ from: fromDate, to: toDate });
  return extractList(await httpGet(`/api/hq/reports/revenue-by-outlet${queryString}`));
}

/** @param {ReportDateRange & { limit: number }} params @returns {Promise<OutletTopItems[]>} */
export async function fetchTopItemsByOutlet({ fromDate, toDate, limit }) {
  // `limit` param ASSUMED — the backend may ignore it and use its own default.
  const queryString = buildQueryString({ from: fromDate, to: toDate, limit });
  return extractList(await httpGet(`/api/hq/reports/top-items${queryString}`));
}
