/**
 * Persists the "View as" selection (HQ admin or a specific outlet) in localStorage.
 *
 * @typedef {{ type: 'hq' }} HqViewAs
 * @typedef {{ type: 'outlet', outletId: string, outletCode: string, outletName: string }} OutletViewAs
 * @typedef {HqViewAs | OutletViewAs} ViewAs
 */

// Key kept from the original app so existing saved selections still load.
const VIEW_AS_STORAGE_KEY = 'fnb.viewAs';

export const VIEW_AS_TYPES = Object.freeze({ HQ: 'hq', OUTLET: 'outlet' });

/** @type {HqViewAs} */
export const HQ_VIEW_AS = Object.freeze({ type: VIEW_AS_TYPES.HQ });

/** @returns {ViewAs} */
export function loadViewAs() {
  try {
    const storedViewAs = JSON.parse(localStorage.getItem(VIEW_AS_STORAGE_KEY));
    if (storedViewAs?.type !== VIEW_AS_TYPES.OUTLET || storedViewAs.outletId == null) return HQ_VIEW_AS;
    return {
      type: VIEW_AS_TYPES.OUTLET,
      outletId: String(storedViewAs.outletId),
      // `code` / `name` are the field names used by the previous version of the app.
      outletCode: storedViewAs.outletCode ?? storedViewAs.code ?? '',
      outletName: storedViewAs.outletName ?? storedViewAs.name ?? '',
    };
  } catch {
    return HQ_VIEW_AS;
  }
}

/** @param {ViewAs} viewAs */
export function saveViewAs(viewAs) {
  try {
    localStorage.setItem(VIEW_AS_STORAGE_KEY, JSON.stringify(viewAs));
  } catch {
    // Storage can be unavailable (private mode, quota). The selection then lasts for this session only.
  }
}
