import { QueryStateBoundary } from '@/components/common/QueryStateBoundary';
import { TOP_ITEMS_LIMIT } from '../constants';
import { OutletTopItemsCard } from './OutletTopItemsCard';

/**
 * Cards for outlets that sold something; outlets without sales collapse into one line
 * instead of a row of empty cards. Order matches the backend: quantity sold, ties by revenue.
 *
 * @param {{
 *   queryState: import('@tanstack/react-query').UseQueryResult,
 *   topItemsByOutlet: import('../api/reportsApi').OutletTopItems[],
 *   outletDetailsById: Map<string, { outletName: string, revenueAmount: number }>,
 *   noSalesMessage: string,
 * }} props
 */
export function TopItemsByOutletSection({ queryState, topItemsByOutlet, outletDetailsById, noSalesMessage }) {
  const getOutletName = (outletTopItems) =>
    outletTopItems.name || outletDetailsById.get(String(outletTopItems.outletId))?.outletName || outletTopItems.code;

  const outletsWithSales = topItemsByOutlet.filter((outletTopItems) => outletTopItems.items?.length > 0);
  const outletsWithoutSales = topItemsByOutlet.filter((outletTopItems) => !outletTopItems.items?.length);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Top {TOP_ITEMS_LIMIT} items per outlet</h2>
        <p className="text-sm text-muted-foreground">Ranked by quantity sold (ties by revenue)</p>
      </div>
      <QueryStateBoundary queryState={queryState} isEmpty={!outletsWithSales.length} emptyMessage={noSalesMessage}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outletsWithSales.map((outletTopItems) => (
            <OutletTopItemsCard
              key={outletTopItems.outletId}
              outletCode={outletTopItems.code}
              outletName={getOutletName(outletTopItems)}
              outletRevenue={outletDetailsById.get(String(outletTopItems.outletId))?.revenueAmount}
              topSellingItems={outletTopItems.items}
            />
          ))}
        </div>
      </QueryStateBoundary>
      {outletsWithoutSales.length > 0 && outletsWithSales.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No sales this period: {outletsWithoutSales.map(getOutletName).join(', ')}
        </p>
      )}
    </section>
  );
}
