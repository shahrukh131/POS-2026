import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ViewAsProvider } from '@/features/view-as/context/ViewAsProvider';
import { queryClient } from '@/lib/api/queryClient';

const TOOLTIP_OPEN_DELAY_IN_MS = 150;

/** Every app-wide provider, in one place. Order matters: query client → router → view-as. */
export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={TOOLTIP_OPEN_DELAY_IN_MS}>
          <ViewAsProvider>{children}</ViewAsProvider>
        </TooltipProvider>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
