import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { assignMenuItemToOutlet, updateOutletAssignment } from '../api/assignmentsApi';

/** Assigns a menu item to the outlet, or updates the existing assignment. */
export function useSaveAssignmentMutation(outletId) {
  const queryClient = useQueryClient();
  return useMutation({
    /**
     * @param {{
     *   menuItemId: string,
     *   isAlreadyAssigned: boolean,
     *   assignmentPayload: import('../api/assignmentsApi').AssignmentPayload,
     * }} variables
     */
    mutationFn: ({ menuItemId, isAlreadyAssigned, assignmentPayload }) =>
      isAlreadyAssigned
        ? updateOutletAssignment(outletId, menuItemId, assignmentPayload)
        : assignMenuItemToOutlet(outletId, { menuItemId, ...assignmentPayload }),
    // Assignment changes alter the outlet's POS menu and can create inventory rows.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.outletAssignments(outletId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.outletMenu(outletId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory(outletId) }),
      ]),
  });
}
