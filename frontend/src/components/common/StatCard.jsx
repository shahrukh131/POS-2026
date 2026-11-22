import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * KPI tile: label, headline value and an optional footer (delta badge or context line).
 * Values use proportional figures — tabular-nums looks loose at display sizes.
 *
 * @param {{
 *   label: string,
 *   value: import('react').ReactNode,
 *   icon?: import('react').ComponentType<{ className?: string }>,
 *   footer?: import('react').ReactNode,
 *   isLoading?: boolean,
 * }} props
 */
export function StatCard({ label, value, icon: Icon, footer, isLoading = false }) {
  return (
    <Card className="gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </>
      ) : (
        <>
          <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
          {footer && <div className="min-h-5 text-xs text-muted-foreground">{footer}</div>}
        </>
      )}
    </Card>
  );
}
