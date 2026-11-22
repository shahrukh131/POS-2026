import { useState } from 'react';
import { Check, CircleCheck, Copy, Plus } from 'lucide-react';
import { OutletCodeTag } from '@/components/common/OutletCodeTag';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatters';

const COPIED_FEEDBACK_DURATION_IN_MS = 2000;
const receiptDateTimeFormatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

/** "22 Nov 2026, 23:02" */
const formatReceiptDateTime = (isoDateString) => receiptDateTimeFormatter.format(new Date(isoDateString));

/**
 * Success confirmation shown after a sale is recorded, with a receipt-style summary.
 * All figures come from the server's sale (see mapSaleReceiptFromApi).
 *
 * @param {{
 *   saleReceipt: import('../api/saleReceiptMapper').SaleReceipt | null,
 *   outletName: string,
 *   outletCode: string,
 *   isOpen: boolean,
 *   onOpenChange: (isOpen: boolean) => void,
 * }} props
 */
export function SaleReceiptDialog({ saleReceipt, outletName, outletCode, isOpen, onOpenChange }) {
  if (!saleReceipt) return null;

  const itemCount = saleReceipt.soldLines.reduce((runningCount, soldLine) => runningCount + soldLine.quantity, 0);
  const itemCountLabel = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-sm">
        <DialogHeader className="items-center gap-3 text-center sm:text-center">
          <span className="flex size-14 animate-in items-center justify-center rounded-full bg-success-muted text-success duration-300 zoom-in-50">
            <CircleCheck className="size-8" aria-hidden />
          </span>
          <div className="space-y-1">
            <DialogTitle className="text-xl">Sale completed</DialogTitle>
            <DialogDescription>
              {formatCurrency(saleReceipt.totalAmount)} received for {itemCountLabel}. Stock has been updated.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Receipt slip */}
        <section aria-label="Receipt" className="rounded-xl border border-dashed bg-muted/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Receipt no.</p>
              <ReceiptNumber receiptNumber={saleReceipt.receiptNumber} />
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="flex items-center justify-end gap-1.5">
                <OutletCodeTag outletCode={outletCode} />
              </p>
              <p className="mt-1 max-w-36 truncate">{outletName}</p>
              <p>{formatReceiptDateTime(saleReceipt.soldAt)}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 border-t border-dashed pt-3 text-sm">
            {saleReceipt.soldLines.map((soldLine) => (
              <li key={soldLine.menuItemId} className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{soldLine.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {soldLine.quantity} × {formatCurrency(soldLine.unitPrice)}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums">{formatCurrency(soldLine.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-baseline justify-between border-t border-dashed pt-3">
            <span className="text-sm font-medium">Total paid</span>
            <strong className="text-2xl">{formatCurrency(saleReceipt.totalAmount)}</strong>
          </div>
        </section>

        <DialogFooter className="sm:justify-stretch">
          <Button size="lg" className="w-full" autoFocus onClick={() => onOpenChange(false)}>
            <Plus /> Start new order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Large receipt number with a copy button (handy for refunds or customer questions). */
function ReceiptNumber({ receiptNumber }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyReceiptNumber = async () => {
    try {
      await navigator.clipboard.writeText(receiptNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_DURATION_IN_MS);
    } catch {
      // Clipboard can be blocked (insecure context / permissions). The number is still visible to read out.
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xl font-bold tracking-wide">{receiptNumber}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground"
        aria-label={isCopied ? 'Receipt number copied' : 'Copy receipt number'}
        onClick={handleCopyReceiptNumber}
      >
        {isCopied ? <Check className="text-success" /> : <Copy />}
      </Button>
    </div>
  );
}
