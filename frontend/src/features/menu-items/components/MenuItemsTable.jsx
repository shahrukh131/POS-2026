import { Pencil } from 'lucide-react';
import { STATUS_BADGE_TONES, StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EMPTY_VALUE_PLACEHOLDER, formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   menuItems: import('../api/menuItemMappers').MenuItem[],
 *   onEditMenuItem: (menuItem: import('../api/menuItemMappers').MenuItem) => void,
 *   onToggleMenuItemStatus: (menuItem: import('../api/menuItemMappers').MenuItem) => void,
 *   togglingMenuItemId: string | null,
 * }} props
 */
export function MenuItemsTable({ menuItems, onEditMenuItem, onToggleMenuItemStatus, togglingMenuItemId }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Base price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {menuItems.map((menuItem) => (
          <TableRow key={menuItem.id} className={cn(!menuItem.isActive && 'opacity-60')}>
            <TableCell className="font-medium">{menuItem.name}</TableCell>
            <TableCell className="text-muted-foreground">{menuItem.sku || EMPTY_VALUE_PLACEHOLDER}</TableCell>
            <TableCell className="text-muted-foreground">
              {menuItem.category || EMPTY_VALUE_PLACEHOLDER}
            </TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(menuItem.basePrice)}</TableCell>
            <TableCell>
              {menuItem.isActive ? (
                <StatusBadge tone={STATUS_BADGE_TONES.SUCCESS}>Active</StatusBadge>
              ) : (
                <StatusBadge>Inactive</StatusBadge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEditMenuItem(menuItem)}>
                  <Pencil /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={togglingMenuItemId === menuItem.id}
                  onClick={() => onToggleMenuItemStatus(menuItem)}
                >
                  {menuItem.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
