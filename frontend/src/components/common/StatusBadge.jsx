import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const STATUS_BADGE_TONES = Object.freeze({
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  NEUTRAL: 'neutral',
});

const toneClassNames = {
  [STATUS_BADGE_TONES.SUCCESS]: 'border-transparent bg-success-muted text-success',
  [STATUS_BADGE_TONES.WARNING]: 'border-transparent bg-warning-muted text-warning',
  [STATUS_BADGE_TONES.DANGER]: 'border-transparent bg-destructive/10 text-destructive',
  [STATUS_BADGE_TONES.NEUTRAL]: 'border-transparent bg-muted text-muted-foreground',
};

/** Colored pill for statuses such as Active / Assigned / Low stock. */
export function StatusBadge({ tone = STATUS_BADGE_TONES.NEUTRAL, children }) {
  return (
    <Badge variant="outline" className={cn(toneClassNames[tone])}>
      {children}
    </Badge>
  );
}
