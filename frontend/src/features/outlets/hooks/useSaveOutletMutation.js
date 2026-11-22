import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { createOutlet, updateOutlet } from '../api/outletsApi';

/** Creates an outlet when `outletId` is null, otherwise updates it. */
export function useSaveOutletMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    /** @param {{ outletId: string | null, outletPayload: object }} variables */
    mutationFn: ({ outletId, outletPayload }) =>
      outletId ? updateOutlet(outletId, outletPayload) : createOutlet(outletPayload),
    // Refreshes the Outlets table and every outlet dropdown / name (View as, Assignments, Inventory, POS header).
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.outlets }),
  });
}
