import { Banknote, Receipt, Store, TrendingUp } from 'lucide-react';
import { DeltaBadge } from '@/components/common/DeltaBadge';
import { StatCard } from '@/components/common/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EMPTY_VALUE_PLACEHOLDER, formatCurrency } from '@/lib/formatters';
import { calculatePercentChange } from '../utils/reportMetrics';

const COMPARISON_LABEL = 'vs previous period';
const ALL_TIME_FOOTER = 'All-time total';

/**
 * @param {{
 *   currentSummary: import('../utils/reportMetrics').RevenueSummary,
 *   previousSummary: import('../utils/reportMetrics').RevenueSummary | null,
 *   hasComparisonPeriod: boolean,   false for "All time" — there is no previous period to compare with
 *   isLoading: boolean,
 *   isComparisonLoading: boolean,
 * }} props
 */
export function ReportKpiRow({ currentSummary, previousSummary, hasComparisonPeriod, isLoading, isComparisonLoading }) {
  const hasOrders = currentSummary.totalOrderCount > 0;

  const renderDelta = (summaryField) => {
    if (!hasComparisonPeriod) return ALL_TIME_FOOTER;
    if (isComparisonLoading) return <Skeleton className="h-4 w-36" />;
    if (!previousSummary) return null; // comparison failed to load — show nothing rather than a wrong number
    return (
      <DeltaBadge
        percentChange={calculatePercentChange(currentSummary[summaryField], previousSummary[summaryField])}
        comparisonLabel={COMPARISON_LABEL}
      />
    );
  };

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total revenue"
        icon={Banknote}
        isLoading={isLoading}
        value={formatCurrency(currentSummary.totalRevenue)}
        footer={renderDelta('totalRevenue')}
      />
      <StatCard
        label="Orders"
        icon={Receipt}
        isLoading={isLoading}
        value={currentSummary.totalOrderCount.toLocaleString()}
        footer={renderDelta('totalOrderCount')}
      />
      <StatCard
        label="Avg. order value"
        icon={TrendingUp}
        isLoading={isLoading}
        // An average of zero orders is undefined, not ৳ 0.00.
        value={hasOrders ? formatCurrency(currentSummary.averageOrderValue) : EMPTY_VALUE_PLACEHOLDER}
        footer={hasOrders ? renderDelta('averageOrderValue') : 'No orders in this period'}
      />
      <StatCard
        label="Active outlets"
        icon={Store}
        isLoading={isLoading}
        value={
          <>
            {currentSummary.activeOutletCount}
            <span className="text-lg font-normal text-muted-foreground"> / {currentSummary.outletCount}</span>
          </>
        }
        footer="Outlets with at least one sale"
      />
    </div>
  );
}
