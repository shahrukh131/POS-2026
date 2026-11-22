import { OutletCodeTag } from '@/components/common/OutletCodeTag';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

/**
 * One outlet's best sellers as a meter list. Items arrive ranked by quantity sold (ties by revenue),
 * so the bar is scaled by quantity relative to the #1 item — bars always shrink down the list.
 *
 * @param {{
 *   outletCode: string,
 *   outletName: string,
 *   outletRevenue: number | undefined,
 *   topSellingItems: import('../api/reportsApi').TopSellingItem[],
 * }} props
 */
export function OutletTopItemsCard({ outletCode, outletName, outletRevenue, topSellingItems }) {
  const highestQuantitySold = Math.max(...topSellingItems.map((topSellingItem) => Number(topSellingItem.qtySold || 0)));

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <OutletCodeTag outletCode={outletCode} />
          <span className="truncate">{outletName}</span>
        </CardTitle>
        {outletRevenue != null && <CardDescription>{formatCurrency(outletRevenue)} total revenue</CardDescription>}
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {topSellingItems.map((topSellingItem, itemIndex) => {
            const quantitySold = Number(topSellingItem.qtySold || 0);
            const barWidthPercent = highestQuantitySold ? (quantitySold / highestQuantitySold) * 100 : 0;
            return (
              <li key={topSellingItem.menuItemId} className="space-y-1.5">
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                    {itemIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{topSellingItem.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">{quantitySold} sold</span>
                  <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(topSellingItem.revenue)}
                  </span>
                </div>
                <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-muted">
                  {quantitySold > 0 && (
                    <div className="h-full rounded-full bg-brand" style={{ width: `${barWidthPercent}%` }} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
