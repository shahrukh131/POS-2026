import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/env';
import { QUERY_KEY_ROOTS } from '@/lib/api/queryKeys';
import { HQ_EVENTS_PATH, SALE_CREATED_EVENT } from '../constants';

/**
 * Live HQ reports: listens to the backend's Server-Sent Events stream and invalidates the report
 * queries when a sale is created anywhere. Mounted once in HqLayout, so it runs on every HQ screen;
 * when Reports is not open, invalidation only marks the data stale and it refetches on open.
 *
 * EventSource reconnects by itself (the server sends `retry: 5000`). After a reconnect, the reports are
 * invalidated once too, because sales made while disconnected sent no event to this tab.
 */
export function useLiveReports() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined; // fallback polling still applies

    const invalidateReports = () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ROOTS.REVENUE_REPORT] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ROOTS.TOP_ITEMS] });
    };

    const eventSource = new EventSource(`${API_BASE_URL}${HQ_EVENTS_PATH}`);
    let hasConnectedBefore = false;

    const handleOpen = () => {
      if (hasConnectedBefore) invalidateReports();
      hasConnectedBefore = true;
    };

    eventSource.addEventListener('open', handleOpen);
    eventSource.addEventListener(SALE_CREATED_EVENT, invalidateReports);

    return () => {
      eventSource.removeEventListener('open', handleOpen);
      eventSource.removeEventListener(SALE_CREATED_EVENT, invalidateReports);
      eventSource.close();
    };
  }, [queryClient]);
}
