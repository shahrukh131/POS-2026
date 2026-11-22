import { OutletCodeTag } from '@/components/common/OutletCodeTag';
import { QueryStateBoundary } from '@/components/common/QueryStateBoundary';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { formatPercent } from '../utils/reportMetrics';

/**
 * Outlets ranked by revenue, with share of total and a one-hue ranked bar (scaled to the top outlet).
 *
 * @param {{
 *   queryState: import('@tanstack/react-query').UseQueryResult,
 *   rankedRevenueRows: import('../utils/reportMetrics').RankedRevenueRow[],
 *   revenueSummary: import('../utils/reportMetrics').RevenueSummary,
 *   hasAnySales: boolean,
 *   noSalesMessage: string,
 * }} props
 */
export function RevenueByOutletCard({ queryState, rankedRevenueRows, revenueSummary, hasAnySales, noSalesMessage }) {
  const hasOutlets = rankedRevenueRows.length > 0;
  return (
    <Card className="mb-8 gap-0 pb-0">
      <CardHeader className="pb-4">
        <CardTitle>Revenue by outlet</CardTitle>
        <CardDescription>Ranked by revenue. Bars are relative to the top outlet.</CardDescription>
      </CardHeader>
      <QueryStateBoundary
        queryState={queryState}
        // The API lists every outlet even with no sales; a table of zeros is shown as an empty state instead.
        isEmpty={!hasOutlets || !hasAnySales}
        emptyMessage={hasOutlets ? noSalesMessage : 'No outlets to report on yet.'}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Share</TableHead>
              <TableHead className="hidden w-[30%] md:table-cell">
                <span className="sr-only">Revenue compared with the top outlet</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedRevenueRows.map((rankedRow) => (
              <RevenueRow key={rankedRow.outletId} rankedRow={rankedRow} />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell />
              <TableCell>Total</TableCell>
              <TableCell className="text-right tabular-nums">{revenueSummary.totalOrderCount}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(revenueSummary.totalRevenue)}</TableCell>
              <TableCell className="text-right tabular-nums">{revenueSummary.totalRevenue ? '100%' : '—'}</TableCell>
              <TableCell className="hidden md:table-cell" />
            </TableRow>
          </TableFooter>
        </Table>
      </QueryStateBoundary>
    </Card>
  );
}

/** @param {{ rankedRow: import('../utils/reportMetrics').RankedRevenueRow }} props */
function RevenueRow({ rankedRow }) {
  const hasRevenue = rankedRow.revenueAmount > 0;

  return (
    <TableRow className={cn(!hasRevenue && 'text-muted-foreground')}>
      <TableCell className="text-muted-foreground tabular-nums">{rankedRow.rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <OutletCodeTag outletCode={rankedRow.outletCode} />
          <span className={cn(hasRevenue && 'font-medium')}>{rankedRow.outletName}</span>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{rankedRow.orderCount}</TableCell>
      <TableCell className={cn('text-right tabular-nums', hasRevenue && 'font-semibold text-foreground')}>
        {formatCurrency(rankedRow.revenueAmount)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatPercent(rankedRow.revenueSharePercent)}</TableCell>
      <TableCell className="hidden md:table-cell">
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Taller invisible hit area than the 8px bar, so the tooltip is easy to reach. */}
            <div className="flex h-6 cursor-default items-center" tabIndex={0} aria-label={`${rankedRow.outletName} revenue bar`}>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                {hasRevenue && (
                  <div className="h-full rounded-full bg-brand" style={{ width: `${rankedRow.barWidthPercent}%` }} />
                )}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="font-semibold">{rankedRow.outletName}</p>
            <p>
              {formatCurrency(rankedRow.revenueAmount)} · {formatPercent(rankedRow.revenueSharePercent)} of revenue
            </p>
            <p>{rankedRow.orderCount} orders</p>
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
