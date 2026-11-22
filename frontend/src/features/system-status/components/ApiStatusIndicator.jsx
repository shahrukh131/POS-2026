import { LoaderCircle, Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { API_BASE_URL } from '@/config/env';
import { cn } from '@/lib/utils';
import { useApiHealthQuery } from '../hooks/useApiHealthQuery';

const API_STATUSES = Object.freeze({
  CHECKING: { label: 'Checking connection…', Icon: LoaderCircle, toneClassName: 'text-muted-foreground', iconClassName: 'animate-spin' },
  ONLINE: { label: 'Connected', Icon: Wifi, toneClassName: 'text-success' },
  OFFLINE: { label: 'Offline — changes won’t be saved', Icon: WifiOff, toneClassName: 'text-destructive' },
});

/** Live backend status. State is shown with an icon AND a label, never color alone. */
export function ApiStatusIndicator() {
  const apiHealthQuery = useApiHealthQuery();

  const apiStatus = apiHealthQuery.isPending
    ? API_STATUSES.CHECKING
    : apiHealthQuery.isError
      ? API_STATUSES.OFFLINE
      : API_STATUSES.ONLINE;
  const { label, Icon, toneClassName, iconClassName } = apiStatus;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => apiHealthQuery.refetch()}
          className={cn('inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium hover:bg-accent', toneClassName)}
          aria-live="polite"
        >
          <Icon className={cn('size-3.5', iconClassName)} aria-hidden />
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>API: {API_BASE_URL}</p>
        <p>Checked every 30 seconds. Click to check now.</p>
      </TooltipContent>
    </Tooltip>
  );
}
