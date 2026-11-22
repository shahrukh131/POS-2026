import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletsQuery } from '@/features/outlets/hooks/useOutletsQuery';
import { HQ_VIEW_AS, VIEW_AS_TYPES, loadViewAs, saveViewAs } from '../viewAsStorage';
import { ViewAsContext } from './viewAsContext';

/** Holds who the app is being viewed as. The outlet list itself comes from useOutletsQuery. Must sit inside QueryClientProvider. */
export function ViewAsProvider({ children }) {
  const [viewAs, setViewAs] = useState(loadViewAs);

  const updateViewAs = useCallback((nextViewAs) => {
    setViewAs(nextViewAs);
    saveViewAs(nextViewAs);
  }, []);

  const switchToHqView = useCallback(() => updateViewAs(HQ_VIEW_AS), [updateViewAs]);

  const switchToOutletView = useCallback(
    (outlet) =>
      updateViewAs({
        type: VIEW_AS_TYPES.OUTLET,
        outletId: String(outlet.id),
        outletCode: outlet.code,
        outletName: outlet.name,
      }),
    [updateViewAs],
  );

  // Keep the saved outlet's name in sync when HQ renames it (e.g. POS header after an edit).
  const { data: outlets } = useOutletsQuery();
  const currentOutlet =
    viewAs.type === VIEW_AS_TYPES.OUTLET ? outlets?.find((outlet) => outlet.id === viewAs.outletId) : undefined;
  const isSavedOutletOutdated =
    Boolean(currentOutlet) &&
    (currentOutlet.name !== viewAs.outletName || currentOutlet.code !== viewAs.outletCode);

  useEffect(() => {
    if (isSavedOutletOutdated) switchToOutletView(currentOutlet);
  }, [isSavedOutletOutdated, currentOutlet, switchToOutletView]);

  const contextValue = useMemo(
    () => ({
      viewAs,
      isHqView: viewAs.type === VIEW_AS_TYPES.HQ,
      switchToHqView,
      switchToOutletView,
    }),
    [viewAs, switchToHqView, switchToOutletView],
  );

  return <ViewAsContext.Provider value={contextValue}>{children}</ViewAsContext.Provider>;
}
