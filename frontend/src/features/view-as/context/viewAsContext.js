import { createContext } from 'react';

/**
 * @typedef {Object} ViewAsContextValue
 * @property {import('../viewAsStorage').ViewAs} viewAs
 * @property {boolean} isHqView
 * @property {() => void} switchToHqView
 * @property {(outlet: { id: string|number, code: string, name: string }) => void} switchToOutletView
 */

/** @type {import('react').Context<ViewAsContextValue | null>} */
export const ViewAsContext = createContext(null);
