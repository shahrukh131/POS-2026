export const ROUTE_PATHS = Object.freeze({
  HQ_OUTLETS: '/hq/outlets',
  HQ_MENU_ITEMS: '/hq/menu-items',
  HQ_ASSIGNMENTS: '/hq/assignments',
  HQ_INVENTORY: '/hq/inventory',
  HQ_REPORTS: '/hq/reports',
  POS: '/pos',
});

/** HQ lands on Reports: the first thing HQ checks is how outlets are performing. */
export const HQ_HOME_PATH = ROUTE_PATHS.HQ_REPORTS;
export const OUTLET_HOME_PATH = ROUTE_PATHS.POS;
