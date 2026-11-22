import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchMenuItems } from '../api/menuItemsApi';

export function useMenuItemsQuery() {
  return useQuery({ queryKey: queryKeys.menuItems, queryFn: fetchMenuItems });
}
