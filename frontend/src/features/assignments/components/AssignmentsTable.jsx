import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssignmentRow } from './AssignmentRow';

/**
 * @param {{
 *   outletId: string,
 *   assignmentRows: import('../hooks/useOutletAssignmentRows').AssignmentRowData[],
 * }} props
 */
export function AssignmentsTable({ outletId, assignmentRows }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Base price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Price override (৳)</TableHead>
          <TableHead>Available</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignmentRows.map(({ menuItem, assignment }) => (
          <AssignmentRow key={menuItem.id} outletId={outletId} menuItem={menuItem} assignment={assignment} />
        ))}
      </TableBody>
    </Table>
  );
}
