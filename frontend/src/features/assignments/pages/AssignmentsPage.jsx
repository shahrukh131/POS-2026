import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryStateBoundary } from '@/components/common/QueryStateBoundary';
import { Card } from '@/components/ui/card';
import { OutletSelect } from '@/features/outlets/components/OutletSelect';
import { AssignmentsTable } from '../components/AssignmentsTable';
import { useOutletAssignmentRows } from '../hooks/useOutletAssignmentRows';

export function AssignmentsPage() {
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const outletAssignmentRows = useOutletAssignmentRows(selectedOutletId);
  const { assignmentRows } = outletAssignmentRows;

  return (
    <>
      <PageHeader
        title="Assignments"
        description="Choose which menu items each outlet sells, with optional price override."
        actions={
          <OutletSelect selectedOutletId={selectedOutletId} onSelectedOutletIdChange={setSelectedOutletId} />
        }
      />
      <Card className="py-0">
        <QueryStateBoundary
          queryState={outletAssignmentRows}
          isEmpty={!assignmentRows.length}
          emptyMessage={
            selectedOutletId
              ? 'No menu items. Create some in Menu Items first.'
              : 'Select an outlet to manage its menu.'
          }
        >
          <AssignmentsTable outletId={selectedOutletId} assignmentRows={assignmentRows} />
        </QueryStateBoundary>
      </Card>
    </>
  );
}
