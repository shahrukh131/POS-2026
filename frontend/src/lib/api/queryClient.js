import { QueryClient } from '@tanstack/react-query';

const FIFTEEN_SECONDS_IN_MS = 15_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: FIFTEEN_SECONDS_IN_MS,
    },
  },
});
