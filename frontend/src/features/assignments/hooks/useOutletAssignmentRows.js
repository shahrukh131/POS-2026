import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMenuItemsQuery } from '@/features/menu-items/hooks/useMenuItemsQuery';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchOutletAssignments } from '../api/assignmentsApi';

/**
 * @typedef {Object} AssignmentRowData
 * @property {import('@/features/menu-items/api/menuItemMappers').MenuItem} menuItem
 * @property {import('@/lib/api/responseMappers').OutletMenuItem | null} assignment  null when not assigned
 */

/**
 * Every master menu item paired with its assignment at the selected outlet.
 * Combines two queries and exposes the fields QueryStateBoundary expects.
 */
export function useOutletAssignmentRows(outletId) {
  const hasOutlet = Boolean(outletId);
  const menuItemsQuery = useMenuItemsQuery();
  const outletAssignmentsQuery = useQuery({
    queryKey: queryKeys.outletAssignments(outletId),
    queryFn: () => fetchOutletAssignments(outletId),
    enabled: hasOutlet,
  });

  const menuItems = menuItemsQuery.data;
  const outletAssignments = outletAssignmentsQuery.data;

  /** @type {AssignmentRowData[]} */
  const assignmentRows = useMemo(() => {
    if (!hasOutlet || !menuItems || !outletAssignments) return [];
    const assignmentsByMenuItemId = new Map(
      outletAssignments.map((assignment) => [String(assignment.menuItemId), assignment]),
    );
    return menuItems.map((menuItem) => ({
      menuItem,
      assignment: assignmentsByMenuItemId.get(menuItem.id) ?? null,
    }));
  }, [hasOutlet, menuItems, outletAssignments]);

  return {
    assignmentRows,
    isLoading: menuItemsQuery.isLoading || outletAssignmentsQuery.isLoading,
    isError: menuItemsQuery.isError || outletAssignmentsQuery.isError,
    error: menuItemsQuery.error ?? outletAssignmentsQuery.error,
    refetch: () => Promise.all([menuItemsQuery.refetch(), outletAssignmentsQuery.refetch()]),
  };
}
