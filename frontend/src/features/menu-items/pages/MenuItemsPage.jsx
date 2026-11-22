import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { QueryStateBoundary } from '@/components/common/QueryStateBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MenuItemFormDialog } from '../components/MenuItemFormDialog';
import { MenuItemsTable } from '../components/MenuItemsTable';
import { useMenuItemsQuery } from '../hooks/useMenuItemsQuery';
import { useToggleMenuItemStatusMutation } from '../hooks/useToggleMenuItemStatusMutation';

const CLOSED_MENU_ITEM_DIALOG = { isOpen: false, menuItemToEdit: null };

export function MenuItemsPage() {
  const menuItemsQuery = useMenuItemsQuery();
  const toggleMenuItemStatusMutation = useToggleMenuItemStatusMutation();
  const [menuItemDialog, setMenuItemDialog] = useState(CLOSED_MENU_ITEM_DIALOG);
  const menuItems = menuItemsQuery.data ?? [];

  const togglingMenuItemId = toggleMenuItemStatusMutation.isPending
    ? toggleMenuItemStatusMutation.variables?.id ?? null
    : null;

  const handleAddMenuItem = () => setMenuItemDialog({ isOpen: true, menuItemToEdit: null });
  const handleEditMenuItem = (menuItem) => setMenuItemDialog({ isOpen: true, menuItemToEdit: menuItem });
  // Keep `menuItemToEdit` while the dialog animates closed so its title doesn't flicker.
  const handleMenuItemDialogOpenChange = (isOpen) =>
    setMenuItemDialog((previousDialog) => ({ ...previousDialog, isOpen }));

  const handleToggleMenuItemStatus = (menuItem) => {
    toggleMenuItemStatusMutation.mutate(menuItem, {
      onSuccess: () => toast.success(`${menuItem.name} ${menuItem.isActive ? 'deactivated' : 'activated'}`),
      onError: (toggleStatusError) => toast.error(toggleStatusError.message),
    });
  };

  return (
    <>
      <PageHeader
        title="Menu Items"
        description="Master menu. Outlets can override price per item."
        actions={
          <Button onClick={handleAddMenuItem}>
            <Plus /> Add item
          </Button>
        }
      />
      <Card className="py-0">
        <QueryStateBoundary
          queryState={menuItemsQuery}
          isEmpty={!menuItems.length}
          emptyMessage="No menu items yet."
        >
          <MenuItemsTable
            menuItems={menuItems}
            onEditMenuItem={handleEditMenuItem}
            onToggleMenuItemStatus={handleToggleMenuItemStatus}
            togglingMenuItemId={togglingMenuItemId}
          />
        </QueryStateBoundary>
      </Card>
      <MenuItemFormDialog
        isOpen={menuItemDialog.isOpen}
        onOpenChange={handleMenuItemDialogOpenChange}
        menuItemToEdit={menuItemDialog.menuItemToEdit}
      />
    </>
  );
}
