import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

/**
 * Renders loading / error / empty / content for a query in one place.
 * `queryState` is a TanStack Query result, or any object with the same fields
 * (see useOutletAssignmentRows, which combines two queries).
 *
 * @param {{
 *   queryState: { isLoading: boolean, isError: boolean, error: Error | null, refetch: () => unknown },
 *   isEmpty: boolean,
 *   emptyMessage?: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export function QueryStateBoundary({ queryState, isEmpty, emptyMessage, children }) {
  if (queryState.isLoading) return <LoadingState />;
  if (queryState.isError) return <ErrorState error={queryState.error} onRetry={() => queryState.refetch()} />;
  if (isEmpty) return <EmptyState message={emptyMessage} />;
  return children;
}
