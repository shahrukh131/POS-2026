import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EMPTY_VALUE_PLACEHOLDER, formatDateTime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { INVENTORY_LOG_FILTERS, INVENTORY_LOG_TYPES } from '../constants';
import { useInventoryLogsQuery } from '../hooks/useInventoryLogsQuery';
import { StockLevelBadge } from './StockLevelBadge';

/**
 * Stock history (sales, restocks, adjustments) of one item at the outlet.
 * Loads 50 rows at a time ("Load older"), so items with thousands of logs stay fast.
 * @param {{
 *   outletId: string,
 *   inventoryRow: import('@/lib/api/responseMappers').OutletMenuItem | null,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 * }} props
 */
export function InventoryLogsDialog({ outletId, inventoryRow, isOpen, onOpenChange }) {
  if (!inventoryRow) return null;
  const currentStock = inventoryRow.stock ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Stock history — {inventoryRow.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            Current stock
            <strong className="text-lg font-semibold tabular-nums text-foreground">{currentStock}</strong>
            <StockLevelBadge stockQuantity={currentStock} />
          </DialogDescription>
        </DialogHeader>
        {/* Rendered inside DialogContent so the filter resets each time the dialog opens. */}
        <InventoryLogsBrowser outletId={outletId} menuItemId={inventoryRow.menuItemId} isOpen={isOpen} />
      </DialogContent>
    </Dialog>
  );
}

function InventoryLogsBrowser({ outletId, menuItemId, isOpen }) {
  const [activeFilter, setActiveFilter] = useState(INVENTORY_LOG_FILTERS[0]);
  const inventoryLogsQuery = useInventoryLogsQuery(outletId, menuItemId, {
    changeType: activeFilter.value,
    isEnabled: isOpen,
  });
  const inventoryLogs = inventoryLogsQuery.data?.pages.flat() ?? [];

  return (
    <div className="min-w-0 space-y-3">
      <div role="group" aria-label="Filter by type" className="inline-flex rounded-lg bg-muted p-1">
        {INVENTORY_LOG_FILTERS.map((filterOption) => {
          const isActive = filterOption === activeFilter;
          return (
            <Button
              key={filterOption.label}
              size="sm"
              variant="ghost"
              aria-pressed={isActive}
              onClick={() => setActiveFilter(filterOption)}
              className={cn(
                'h-7 text-muted-foreground',
                isActive && 'bg-background text-foreground shadow-sm hover:bg-background',
              )}
            >
              {filterOption.label}
            </Button>
          );
        })}
      </div>

      <div className="rounded-md border">
        <InventoryLogsContent
          inventoryLogsQuery={inventoryLogsQuery}
          inventoryLogs={inventoryLogs}
          emptyMessage={activeFilter.emptyMessage}
        />
      </div>

      {inventoryLogs.length > 0 && (
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Showing {inventoryLogs.length} {inventoryLogs.length === 1 ? 'change' : 'changes'}
            {!inventoryLogsQuery.hasNextPage && ' · end of history'}
          </span>
          {inventoryLogsQuery.hasNextPage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => inventoryLogsQuery.fetchNextPage()}
              disabled={inventoryLogsQuery.isFetchingNextPage}
            >
              {inventoryLogsQuery.isFetchingNextPage ? 'Loading…' : 'Load older'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function InventoryLogsContent({ inventoryLogsQuery, inventoryLogs, emptyMessage }) {
  if (inventoryLogsQuery.isLoading) return <LoadingState />;
  if (inventoryLogsQuery.isError) {
    return <ErrorState error={inventoryLogsQuery.error} onRetry={() => inventoryLogsQuery.refetch()} />;
  }
  if (!inventoryLogs.length) return <EmptyState message={emptyMessage} />;

  return (
    // The Table's own wrapper scrolls horizontally, which would break the sticky header; let this div scroll instead.
    <div className="max-h-[55vh] overflow-y-auto [&>[data-slot=table-container]]:overflow-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background shadow-[inset_0_-1px_0_var(--border)]">
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryLogs.map((inventoryLog) => (
            <InventoryLogRow key={inventoryLog.id} inventoryLog={inventoryLog} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** @param {{ inventoryLog: import('../api/inventoryApi').InventoryLog }} props */
function InventoryLogRow({ inventoryLog }) {
  const logType = INVENTORY_LOG_TYPES[inventoryLog.changeType] ?? { label: inventoryLog.changeType };
  const isIncrease = inventoryLog.quantityChange > 0;
  const noteText =
    inventoryLog.note ?? (inventoryLog.saleId != null ? `Sale #${inventoryLog.saleId}` : EMPTY_VALUE_PLACEHOLDER);

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDateTime(inventoryLog.createdAt)}
      </TableCell>
      <TableCell>
        <StatusBadge tone={logType.tone}>{logType.label}</StatusBadge>
      </TableCell>
      <TableCell
        className={cn('text-right font-semibold tabular-nums', isIncrease ? 'text-success' : 'text-destructive')}
      >
        {isIncrease ? `+${inventoryLog.quantityChange}` : inventoryLog.quantityChange}
      </TableCell>
      <TableCell className="text-right tabular-nums">{inventoryLog.balanceAfter}</TableCell>
      <TableCell className="max-w-56 truncate text-muted-foreground" title={noteText}>
        {noteText}
      </TableCell>
    </TableRow>
  );
}
