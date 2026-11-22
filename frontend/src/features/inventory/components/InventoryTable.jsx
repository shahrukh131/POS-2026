import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/formatters';
import { STOCK_CHANGE_TYPES } from '../constants';
import { StockLevelBadge } from './StockLevelBadge';

/**
 * @param {{
 *   inventoryRows: import('@/lib/api/responseMappers').OutletMenuItem[],
 *   onRequestStockChange: (stockChangeRequest: { changeType: string, inventoryRow: object }) => void,
 * }} props
 */
export function InventoryTable({ inventoryRows, onRequestStockChange }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">In stock</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Last updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventoryRows.map((inventoryRow) => {
          const stockQuantity = inventoryRow.stock ?? 0;
          return (
            <TableRow key={inventoryRow.menuItemId}>
              <TableCell className="font-medium">{inventoryRow.name}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{stockQuantity}</TableCell>
              <TableCell>
                <StockLevelBadge stockQuantity={stockQuantity} />
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(inventoryRow.updatedAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    onClick={() => onRequestStockChange({ changeType: STOCK_CHANGE_TYPES.RESTOCK, inventoryRow })}
                  >
                    Restock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestStockChange({ changeType: STOCK_CHANGE_TYPES.ADJUST, inventoryRow })}
                  >
                    Adjust
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
