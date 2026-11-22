import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMenuItem } from '../api/menuItemsApi';
import { invalidateMenuItemQueries } from './invalidateMenuItemQueries';

/** Flips a menu item between active and inactive. */
export function useToggleMenuItemStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    /** @param {import('../api/menuItemMappers').MenuItem} menuItem */
    mutationFn: (menuItem) => updateMenuItem(menuItem.id, { isActive: !menuItem.isActive }),
    onSuccess: () => invalidateMenuItemQueries(queryClient),
  });
}
