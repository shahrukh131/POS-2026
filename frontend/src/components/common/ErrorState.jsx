import { CircleAlert, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/** @param {{ error: Error | null, onRetry?: () => void }} props */
export function ErrorState({ error, onRetry }) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Something went wrong.</AlertTitle>
        <AlertDescription>
          <p>{error?.message}</p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
              <RefreshCw /> Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
