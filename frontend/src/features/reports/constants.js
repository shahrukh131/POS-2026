export const TOP_ITEMS_LIMIT = 5;

/** Fallback polling while the Reports page is open, in case the live SSE stream is down. */
export const REPORT_REFETCH_INTERVAL_IN_MS = 60_000;

/** Live updates: GET /api/hq/events (Server-Sent Events). */
export const HQ_EVENTS_PATH = '/api/hq/events';
export const SALE_CREATED_EVENT = 'sale.created';
