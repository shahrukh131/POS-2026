import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryStateBoundary } from '@/components/common/QueryStateBoundary';
import { Card } from '@/components/ui/card';
import { OutletSelect } from '@/features/outlets/components/OutletSelect';
import { InventoryLogsDialog } from '../components/InventoryLogsDialog';
import { InventoryTable } from '../components/InventoryTable';
import { StockChangeDialog } from '../components/StockChangeDialog';
import { useInventoryQuery } from '../hooks/useInventoryQuery';

export function InventoryPage() {
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [stockChangeRequest, setStockChangeRequest] = useState(null);
  const [isStockChangeDialogOpen, setIsStockChangeDialogOpen] = useState(false);
  const [historyMenuItemId, setHistoryMenuItemId] = useState(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const inventoryQuery = useInventoryQuery(selectedOutletId);
  const inventoryRows = inventoryQuery.data ?? [];
  // Looked up from fresh query data so the dialog's "current stock" updates after a restock/adjust.
  const historyInventoryRow =
    inventoryRows.find((inventoryRow) => inventoryRow.menuItemId === historyMenuItemId) ?? null;

  const handleRequestStockChange = (nextStockChangeRequest) => {
    setStockChangeRequest(nextStockChangeRequest);
    setIsStockChangeDialogOpen(true);
  };

  const handleRequestHistory = (inventoryRow) => {
    setHistoryMenuItemId(inventoryRow.menuItemId);
    setIsHistoryDialogOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock per outlet. Every change is logged."
        actions={
          <OutletSelect selectedOutletId={selectedOutletId} onSelectedOutletIdChange={setSelectedOutletId} />
        }
      />
      <Card className="py-0">
        <QueryStateBoundary
          queryState={inventoryQuery}
          isEmpty={!inventoryRows.length}
          emptyMessage={
            selectedOutletId
              ? 'No stock rows for this outlet. Assign menu items first.'
              : 'Select an outlet to see its stock.'
          }
        >
          <InventoryTable
            inventoryRows={inventoryRows}
            onRequestStockChange={handleRequestStockChange}
            onRequestHistory={handleRequestHistory}
          />
        </QueryStateBoundary>
      </Card>
      <StockChangeDialog
        outletId={selectedOutletId}
        stockChangeRequest={stockChangeRequest}
        isOpen={isStockChangeDialogOpen}
        onOpenChange={setIsStockChangeDialogOpen}
      />
      <InventoryLogsDialog
        outletId={selectedOutletId}
        inventoryRow={historyInventoryRow}
        isOpen={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />
    </>
  );
}
