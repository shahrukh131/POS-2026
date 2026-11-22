import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMenuItem, updateMenuItem } from '../api/menuItemsApi';
import { invalidateMenuItemQueries } from './invalidateMenuItemQueries';

/** Creates a menu item when `menuItemId` is null, otherwise updates it. */
export function useSaveMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    /** @param {{ menuItemId: string | null, menuItemPayload: import('../api/menuItemsApi').MenuItemPayload }} variables */
    mutationFn: ({ menuItemId, menuItemPayload }) =>
      menuItemId ? updateMenuItem(menuItemId, menuItemPayload) : createMenuItem(menuItemPayload),
    onSuccess: () => invalidateMenuItemQueries(queryClient),
  });
}
