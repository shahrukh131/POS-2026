import { useContext } from 'react';
import { ViewAsContext } from '../context/viewAsContext';

/** @returns {import('../context/viewAsContext').ViewAsContextValue} */
export function useViewAs() {
  const viewAsContextValue = useContext(ViewAsContext);
  if (!viewAsContextValue) throw new Error('useViewAs must be used inside <ViewAsProvider>');
  return viewAsContextValue;
}
