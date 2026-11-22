import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FormTextField } from '@/components/common/form/FormTextField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useSaveMenuItemMutation } from '../hooks/useSaveMenuItemMutation';
import {
  getMenuItemFormValues,
  menuItemFormSchema,
  toMenuItemPayload,
} from '../schemas/menuItemFormSchema';

/**
 * Add / edit dialog. `menuItemToEdit` is null when adding a new item.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   menuItemToEdit: import('../api/menuItemMappers').MenuItem | null,
 * }} props
 */
export function MenuItemFormDialog({ isOpen, onOpenChange, menuItemToEdit }) {
  const isEditing = Boolean(menuItemToEdit);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${menuItemToEdit.name}` : 'Add menu item'}</DialogTitle>
          <DialogDescription>Master menu item. Outlets can override the price.</DialogDescription>
        </DialogHeader>
        {/* Rendered inside DialogContent so the form remounts with fresh values each time it opens. */}
        <MenuItemForm menuItemToEdit={menuItemToEdit} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MenuItemForm({ menuItemToEdit, onClose }) {
  const isEditing = Boolean(menuItemToEdit);
  const saveMenuItemMutation = useSaveMenuItemMutation();
  const menuItemForm = useForm({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: getMenuItemFormValues(menuItemToEdit),
  });

  const handleValidSubmit = (menuItemFormValues) => {
    saveMenuItemMutation.mutate(
      { menuItemId: menuItemToEdit?.id ?? null, menuItemPayload: toMenuItemPayload(menuItemFormValues) },
      {
        onSuccess: () => {
          toast.success(isEditing ? 'Menu item updated' : 'Menu item created');
          onClose();
        },
        onError: (saveMenuItemError) => toast.error(saveMenuItemError.message),
      },
    );
  };

  return (
    <Form {...menuItemForm}>
      <form onSubmit={menuItemForm.handleSubmit(handleValidSubmit)} className="space-y-4" noValidate>
        <FormTextField
          control={menuItemForm.control}
          name="name"
          label="Name"
          placeholder="Chicken Burger"
          autoFocus
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormTextField control={menuItemForm.control} name="sku" label="SKU" placeholder="BRG-001" />
          <FormTextField
            control={menuItemForm.control}
            name="category"
            label="Category"
            placeholder="Burgers"
          />
        </div>
        <FormTextField
          control={menuItemForm.control}
          name="basePrice"
          label="Base price (৳)"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
        />
        <FormField
          control={menuItemForm.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Active</FormLabel>
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMenuItemMutation.isPending}>
            {saveMenuItemMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
