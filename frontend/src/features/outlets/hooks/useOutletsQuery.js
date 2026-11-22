import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchOutlets } from '../api/outletsApi';

export function useOutletsQuery() {
  return useQuery({ queryKey: queryKeys.outlets, queryFn: fetchOutlets });
}
