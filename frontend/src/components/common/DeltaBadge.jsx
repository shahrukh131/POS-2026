import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_DISPLAYED_PERCENT = 999;
const deltaPercentFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function formatSignedPercent(percentChange) {
  if (Math.abs(percentChange) > MAX_DISPLAYED_PERCENT) return `${percentChange > 0 ? '>+' : '<-'}${MAX_DISPLAYED_PERCENT}%`;
  const sign = percentChange > 0 ? '+' : '';
  return `${sign}${deltaPercentFormatter.format(percentChange)}%`;
}

/**
 * Period-over-period change. Direction is shown by an arrow AND a sign, never by color alone.
 *
 * @param {{
 *   percentChange: number | null,   null = no baseline (previous period was zero)
 *   comparisonLabel: string,        e.g. "vs previous period"
 *   isIncreaseGood?: boolean,       false for metrics like refunds, where up is bad
 * }} props
 */
export function DeltaBadge({ percentChange, comparisonLabel, isIncreaseGood = true }) {
  if (percentChange == null) {
    return <span className="text-muted-foreground">No prior data {comparisonLabel}</span>;
  }

  const isUnchanged = Math.abs(percentChange) < 0.05;
  const isIncrease = percentChange > 0;
  const isImprovement = isIncrease === isIncreaseGood;
  const DirectionIcon = isUnchanged ? Minus : isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold',
          isUnchanged && 'bg-muted text-muted-foreground',
          !isUnchanged && isImprovement && 'bg-success-muted text-success',
          !isUnchanged && !isImprovement && 'bg-destructive/10 text-destructive',
        )}
      >
        <DirectionIcon className="size-3.5" aria-hidden />
        {isUnchanged ? '0.0%' : formatSignedPercent(percentChange)}
      </span>
      <span className="text-muted-foreground">{comparisonLabel}</span>
    </span>
  );
}
