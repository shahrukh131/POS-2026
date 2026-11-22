import { Lock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';
import { CartLineItem } from './CartLineItem';

/**
 * @param {{
 *   cartLines: import('../api/saleReceiptMapper').CartLine[],
 *   cartTotal: number,
 *   isEditingLocked: boolean,   true while a failed checkout attempt is unresolved
 *   onChangeQuantity: (menuItemId: string|number, nextQuantity: number) => void,
 *   onRemoveLine: (menuItemId: string|number) => void,
 *   onReviewOrder: () => void,
 *   onClearCart: () => void,
 * }} props
 */
export function CartPanel({
  cartLines,
  cartTotal,
  isEditingLocked,
  onChangeQuantity,
  onRemoveLine,
  onReviewOrder,
  onClearCart,
}) {
  const hasCartLines = cartLines.length > 0;

  return (
    <Card className="gap-4 lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="size-4" /> Current order
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditingLocked && (
          <p className="mb-2 flex items-center gap-1.5 rounded-md bg-warning-muted px-2 py-1.5 text-xs text-warning">
            <Lock className="size-3.5" /> Checkout didn&apos;t finish. Review the order to retry.
          </p>
        )}
        {hasCartLines ? (
          <ul className="divide-y">
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
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">Cart is empty. Tap an item to add it.</p>
        )}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <strong className="text-xl tabular-nums">{formatCurrency(cartTotal)}</strong>
        </div>
        {/* Nothing is charged here: this opens the Confirm sale step. */}
        <Button size="lg" disabled={!hasCartLines} onClick={onReviewOrder}>
          Review order
        </Button>
        {hasCartLines && (
          <Button variant="ghost" disabled={isEditingLocked} onClick={onClearCart}>
            Clear
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
