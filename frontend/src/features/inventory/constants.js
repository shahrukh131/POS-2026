import { STATUS_BADGE_TONES } from '@/components/common/StatusBadge';

export const STOCK_CHANGE_TYPES = Object.freeze({
  RESTOCK: 'restock',
  ADJUST: 'adjust',
});

/** Logs per page in the stock history dialog (backend allows 1–200). */
export const INVENTORY_LOGS_PAGE_SIZE = 50;

/** Display label + badge tone per backend `changeType`. */
export const INVENTORY_LOG_TYPES = Object.freeze({
  RESTOCK: { label: 'Restock', tone: STATUS_BADGE_TONES.SUCCESS },
  SALE: { label: 'Sale', tone: STATUS_BADGE_TONES.NEUTRAL },
  ADJUSTMENT: { label: 'Adjustment', tone: STATUS_BADGE_TONES.WARNING },
});

/** Filter options in the stock history dialog. `value` undefined = all types. */
export const INVENTORY_LOG_FILTERS = Object.freeze([
  { label: 'All', value: undefined, emptyMessage: 'No stock changes yet.' },
  { label: 'Sales', value: 'SALE', emptyMessage: 'No sales of this item yet.' },
  { label: 'Restocks', value: 'RESTOCK', emptyMessage: 'No restocks yet.' },
  { label: 'Adjustments', value: 'ADJUSTMENT', emptyMessage: 'No adjustments yet.' },
]);
