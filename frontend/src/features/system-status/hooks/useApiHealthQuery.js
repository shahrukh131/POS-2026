import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/queryKeys';
import { fetchApiHealth } from '../api/healthApi';

const HEALTH_CHECK_INTERVAL_IN_MS = 30_000;

/** Polls the backend so the footer can show whether sales and edits will go through. */
export function useApiHealthQuery() {
  return useQuery({
    queryKey: queryKeys.apiHealth,
    queryFn: fetchApiHealth,
    refetchInterval: HEALTH_CHECK_INTERVAL_IN_MS,
    refetchOnWindowFocus: true,
    retry: false, // report an outage on the first failure instead of after a retry
    staleTime: 0,
  });
}
