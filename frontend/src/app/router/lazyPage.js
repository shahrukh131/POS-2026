import { lazy } from 'react';

/**
 * React.lazy for modules that use named exports (our convention) instead of a default export.
 * @param {() => Promise<Record<string, import('react').ComponentType<any>>>} importPageModule
 * @param {string} exportName
 */
export const lazyPage = (importPageModule, exportName) =>
  lazy(() => importPageModule().then((pageModule) => ({ default: pageModule[exportName] })));
