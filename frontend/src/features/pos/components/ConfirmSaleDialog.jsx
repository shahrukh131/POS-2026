import { CircleAlert, RefreshCw, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { CartLineItem } from './CartLineItem';

/**
 * Review step before charging. The order stays editable until "Confirm sale" is pressed;
 * nothing is deducted or numbered before that.
 *
 * @param {{
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 *   cartLines: import('../api/saleReceiptMapper').CartLine[],
 *   cartTotal: number,
 *   itemCount: number,
 *   hasStockProblems: boolean,
 *   onChangeQuantity: (menuItemId: string|number, nextQuantity: number) => void,
 *   onRemoveLine: (menuItemId: string|number) => void,
 *   onConfirmSale: () => void,
 *   isCheckingOut: boolean,
 *   isStockConflict: boolean,          last attempt was rejected with 409
 *   hasUnresolvedFailure: boolean,     last attempt failed on the network / 5xx — editing is locked
 *   failureMessage?: string,
 *   onDiscardFailedAttempt: () => void,
 * }} props
 */
export function ConfirmSaleDialog({
  isOpen,
  onOpenChange,
  cartLines,
  cartTotal,
  itemCount,
  hasStockProblems,
  onChangeQuantity,
  onRemoveLine,
  onConfirmSale,
  isCheckingOut,
  isStockConflict,
  hasUnresolvedFailure,
  failureMessage,
  onDiscardFailedAttempt,
}) {
  const isEditingLocked = isCheckingOut || hasUnresolvedFailure;
  const isConfirmDisabled = isCheckingOut || hasStockProblems || !cartLines.length;

  // A request in flight must finish: closing now would hide its result from the cashier.
  const handleOpenChange = (nextIsOpen) => {
    if (!nextIsOpen && isCheckingOut) return;
    onOpenChange(nextIsOpen);
  };

  const confirmButtonLabel = isCheckingOut
    ? 'Processing…'
    : hasUnresolvedFailure
      ? `Retry · ${formatCurrency(cartTotal)}`
      : `Confirm sale · ${formatCurrency(cartTotal)}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!isCheckingOut}>
        <DialogHeader>
          <DialogTitle>Confirm sale</DialogTitle>
          <DialogDescription>
            {itemCount} {itemCount === 1 ? 'item' : 'items'}. Stock is deducted and a receipt number is issued when
            you confirm.
          </DialogDescription>
        </DialogHeader>

        {isStockConflict && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>Not enough stock</AlertTitle>
            <AlertDescription>
              Stock changed since the menu loaded. Reduce the flagged lines, then confirm again.
            </AlertDescription>
          </Alert>
        )}
        {hasUnresolvedFailure && (
          <Alert>
            <CircleAlert />
            <AlertTitle>Checkout didn&apos;t go through</AlertTitle>
            <AlertDescription>
              <p>{failureMessage} Retrying is safe — it won&apos;t charge twice.</p>
              <Button variant="link" className="h-auto p-0 text-xs" onClick={onDiscardFailedAttempt}>
                Discard attempt and edit the order (only if you&apos;re sure it wasn&apos;t charged)
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <ul className="max-h-[50vh] divide-y overflow-y-auto pr-1">
          {cartLines.map((cartLine) => (
            <CartLineItem
              key={cartLine.menuItem.menuItemId}
              cartLine={cartLine}
              isEditingLocked={isEditingLocked}
              onChangeQuantity={onChangeQuantity}
              onRemove={onRemoveLine}
            />
          ))}
        </ul>

        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <strong className="text-xl tabular-nums">{formatCurrency(cartTotal)}</strong>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isCheckingOut} onClick={() => onOpenChange(false)}>
            Back to menu
          </Button>
          <Button autoFocus disabled={isConfirmDisabled} onClick={onConfirmSale}>
            {hasUnresolvedFailure && !isCheckingOut && <RefreshCw />}
            {confirmButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
