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
import { Form } from '@/components/ui/form';
import { useSaveOutletMutation } from '../hooks/useSaveOutletMutation';
import {
  OUTLET_CODE_MAX_LENGTH,
  getOutletFormValues,
  outletFormSchema,
  toCreateOutletPayload,
  toUpdateOutletPayload,
} from '../schemas/outletFormSchema';

/**
 * Add / edit dialog. `outletToEdit` is null when adding a new outlet.
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   outletToEdit: import('../api/outletMappers').Outlet | null,
 * }} props
 */
export function OutletFormDialog({ isOpen, onOpenChange, outletToEdit }) {
  const isEditing = Boolean(outletToEdit);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${outletToEdit.name}` : 'Add outlet'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the outlet name or address.' : 'Create a new restaurant branch managed by HQ.'}
          </DialogDescription>
        </DialogHeader>
        {/* Rendered inside DialogContent so the form remounts with fresh values each time it opens. */}
        <OutletForm outletToEdit={outletToEdit} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function OutletForm({ outletToEdit, onClose }) {
  const isEditing = Boolean(outletToEdit);
  const saveOutletMutation = useSaveOutletMutation();
  const outletForm = useForm({
    resolver: zodResolver(outletFormSchema),
    defaultValues: getOutletFormValues(outletToEdit),
  });

  const handleValidSubmit = (outletFormValues) => {
    const outletPayload = isEditing
      ? toUpdateOutletPayload(outletFormValues)
      : toCreateOutletPayload(outletFormValues);

    saveOutletMutation.mutate(
      { outletId: outletToEdit?.id ?? null, outletPayload },
      {
        onSuccess: () => {
          toast.success(`Outlet ${outletFormValues.name} ${isEditing ? 'updated' : 'created'}`);
          onClose();
        },
        onError: (saveOutletError) => toast.error(saveOutletError.message),
      },
    );
  };

  return (
    <Form {...outletForm}>
      <form onSubmit={outletForm.handleSubmit(handleValidSubmit)} className="space-y-4" noValidate>
        <FormTextField
          control={outletForm.control}
          name="code"
          label="Code"
          description={
            isEditing
              ? 'The code cannot be changed: it is printed on existing receipts.'
              : '2–10 letters, used in receipt numbers, e.g. DHA'
          }
          placeholder="DHA"
          maxLength={OUTLET_CODE_MAX_LENGTH}
          className="uppercase"
          disabled={isEditing}
          autoFocus={!isEditing}
        />
        <FormTextField
          control={outletForm.control}
          name="name"
          label="Name"
          placeholder="Chai & Chill Dhanmondi"
          autoFocus={isEditing}
        />
        <FormTextField
          control={outletForm.control}
          name="address"
          label="Address"
          placeholder="House 32, Road 7A, Dhanmondi, Dhaka 1209"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveOutletMutation.isPending}>
            {saveOutletMutation.isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
