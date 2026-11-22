import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryStateBoundary } from '@/components/common/QueryStateBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OutletFormDialog } from '../components/OutletFormDialog';
import { OutletsTable } from '../components/OutletsTable';
import { useOutletsQuery } from '../hooks/useOutletsQuery';

const CLOSED_OUTLET_DIALOG = { isOpen: false, outletToEdit: null };

export function OutletsPage() {
  const outletsQuery = useOutletsQuery();
  const [outletDialog, setOutletDialog] = useState(CLOSED_OUTLET_DIALOG);
  const outlets = outletsQuery.data ?? [];

  const handleAddOutlet = () => setOutletDialog({ isOpen: true, outletToEdit: null });
  const handleEditOutlet = (outlet) => setOutletDialog({ isOpen: true, outletToEdit: outlet });
  // Keep `outletToEdit` while the dialog animates closed so its title doesn't flicker.
  const handleOutletDialogOpenChange = (isOpen) =>
    setOutletDialog((previousDialog) => ({ ...previousDialog, isOpen }));

  return (
    <>
      <PageHeader
        title="Outlets"
        description="All restaurant branches managed by HQ."
        actions={
          <Button onClick={handleAddOutlet}>
            <Plus /> Add outlet
          </Button>
        }
      />
      <Card className="py-0">
        <QueryStateBoundary
          queryState={outletsQuery}
          isEmpty={!outlets.length}
          emptyMessage="No outlets yet. Add your first outlet."
        >
          <OutletsTable outlets={outlets} onEditOutlet={handleEditOutlet} />
        </QueryStateBoundary>
      </Card>
      <OutletFormDialog
        isOpen={outletDialog.isOpen}
        onOpenChange={handleOutletDialogOpenChange}
        outletToEdit={outletDialog.outletToEdit}
      />
    </>
  );
}
