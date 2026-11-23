/**
 * Central TanStack Query keys. Always build keys from here so invalidation stays consistent.
 * The first segment of every key is its root, so
 * `invalidateQueries({ queryKey: [QUERY_KEY_ROOTS.TOP_ITEMS] })` invalidates every variant.
 */
export const QUERY_KEY_ROOTS = Object.freeze({
  OUTLETS: 'outlets',
  MENU_ITEMS: 'menuItems',
  OUTLET_ASSIGNMENTS: 'outletAssignments',
  OUTLET_MENU: 'outletMenu',
  INVENTORY: 'inventory',
  INVENTORY_LOGS: 'inventoryLogs',
  REVENUE_REPORT: 'revenueReport',
  TOP_ITEMS: 'topItems',
  API_HEALTH: 'apiHealth',
});

export const queryKeys = {
  outlets: [QUERY_KEY_ROOTS.OUTLETS],
  menuItems: [QUERY_KEY_ROOTS.MENU_ITEMS],
  outletAssignments: (outletId) => [QUERY_KEY_ROOTS.OUTLET_ASSIGNMENTS, String(outletId)],
  outletMenu: (outletId) => [QUERY_KEY_ROOTS.OUTLET_MENU, String(outletId)],
  inventory: (outletId) => [QUERY_KEY_ROOTS.INVENTORY, String(outletId)],
  /** Pass only `outletId` to match every item's logs at that outlet (prefix match). */
  inventoryLogs: (outletId, menuItemId, changeType) =>
    menuItemId == null
      ? [QUERY_KEY_ROOTS.INVENTORY_LOGS, String(outletId)]
      : [QUERY_KEY_ROOTS.INVENTORY_LOGS, String(outletId), String(menuItemId), changeType ?? 'ALL'],
  revenueReport: (reportParams) => [QUERY_KEY_ROOTS.REVENUE_REPORT, reportParams],
  topItems: (reportParams) => [QUERY_KEY_ROOTS.TOP_ITEMS, reportParams],
  apiHealth: [QUERY_KEY_ROOTS.API_HEALTH],
};
