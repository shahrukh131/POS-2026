import { Pencil } from 'lucide-react';
import { OutletCodeTag } from '@/components/common/OutletCodeTag';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EMPTY_VALUE_PLACEHOLDER, formatDate } from '@/lib/formatters';

/**
 * @param {{
 *   outlets: import('../api/outletMappers').Outlet[],
 *   onEditOutlet: (outlet: import('../api/outletMappers').Outlet) => void,
 * }} props
 */
export function OutletsTable({ outlets, onEditOutlet }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {outlets.map((outlet) => (
          <TableRow key={outlet.id}>
            <TableCell>
              <OutletCodeTag outletCode={outlet.code} />
            </TableCell>
            <TableCell className="font-medium">{outlet.name}</TableCell>
            <TableCell className="text-muted-foreground">{outlet.address || EMPTY_VALUE_PLACEHOLDER}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(outlet.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                aria-label={`Edit ${outlet.name}`}
                onClick={() => onEditOutlet(outlet)}
              >
                <Pencil /> Edit
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
