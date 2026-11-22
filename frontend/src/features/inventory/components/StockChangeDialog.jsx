import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { STOCK_CHANGE_TYPES } from '../constants';
import { useStockChangeMutation } from '../hooks/useStockChangeMutation';
import {
  STOCK_CHANGE_FORM_DEFAULT_VALUES,
  createStockChangeFormSchema,
} from '../schemas/stockChangeFormSchema';

/**
 * @typedef {{ changeType: 'restock' | 'adjust', inventoryRow: import('@/lib/api/responseMappers').OutletMenuItem }} StockChangeRequest
 */

/**
 * @param {{
 *   outletId: string,
 *   stockChangeRequest: StockChangeRequest | null,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 * }} props
 */
export function StockChangeDialog({ outletId, stockChangeRequest, isOpen, onOpenChange }) {
  if (!stockChangeRequest) return null;
  const { changeType, inventoryRow } = stockChangeRequest;
  const isRestock = changeType === STOCK_CHANGE_TYPES.RESTOCK;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRestock ? 'Restock' : 'Adjust'} — {inventoryRow.name}
          </DialogTitle>
          <DialogDescription>
            {isRestock ? 'Add delivered stock.' : 'Correct stock for waste, damage or a recount.'} Every change is
            logged.
          </DialogDescription>
        </DialogHeader>
        {/* Rendered inside DialogContent so the form remounts with empty values each time it opens. */}
        <StockChangeForm
          outletId={outletId}
          changeType={changeType}
          inventoryRow={inventoryRow}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function StockChangeForm({ outletId, changeType, inventoryRow, onClose }) {
  const isRestock = changeType === STOCK_CHANGE_TYPES.RESTOCK;
  const currentStock = inventoryRow.stock ?? 0;
  const stockChangeMutation = useStockChangeMutation(outletId);

  const stockChangeFormSchema = useMemo(
    () => createStockChangeFormSchema({ changeType, currentStock }),
    [changeType, currentStock],
  );
  const stockChangeForm = useForm({
    resolver: zodResolver(stockChangeFormSchema),
    defaultValues: STOCK_CHANGE_FORM_DEFAULT_VALUES,
  });

  const quantityChangeInput = useWatch({ control: stockChangeForm.control, name: 'quantityChange' });
  const quantityChangeNumber = Number(quantityChangeInput);
  const projectedStock =
    quantityChangeInput !== '' && Number.isFinite(quantityChangeNumber)
      ? currentStock + quantityChangeNumber
      : null;

  const handleValidSubmit = ({ quantityChange, note }) => {
    const quantityChangeAmount = Number(quantityChange);
    const stockAfterChange = currentStock + quantityChangeAmount;
    stockChangeMutation.mutate(
      { changeType, menuItemId: inventoryRow.menuItemId, quantityChange: quantityChangeAmount, note },
      {
        onSuccess: () => {
          toast.success(`${inventoryRow.name}: stock is now ${stockAfterChange}`);
          onClose();
        },
        onError: (stockChangeError) => toast.error(stockChangeError.message),
      },
    );
  };

  return (
    <Form {...stockChangeForm}>
      <form onSubmit={stockChangeForm.handleSubmit(handleValidSubmit)} className="space-y-4" noValidate>
        <p className="text-sm text-muted-foreground">
          Current stock: <strong className="text-foreground">{currentStock}</strong>
          {projectedStock != null && (
            <>
              {' '}
              → after: <strong className="text-foreground">{projectedStock}</strong>
            </>
          )}
        </p>
        <FormTextField
          control={stockChangeForm.control}
          name="quantityChange"
          label={isRestock ? 'Quantity to add' : 'Change (+/-)'}
          description={isRestock ? undefined : 'Use negative for waste/damage, e.g. -2'}
          type="number"
          inputMode="numeric"
          step="1"
          min={isRestock ? 1 : undefined}
          autoFocus
        />
        <FormTextField
          control={stockChangeForm.control}
          name="note"
          label={isRestock ? 'Note (optional)' : 'Reason'}
          placeholder={isRestock ? 'Morning delivery' : 'Damaged / count correction'}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={stockChangeMutation.isPending}>
            {stockChangeMutation.isPending ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
