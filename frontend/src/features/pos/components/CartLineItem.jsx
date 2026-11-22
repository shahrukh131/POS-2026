import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

/**
 * One editable cart line, shared by the cart panel and the Confirm sale dialog.
 * @param {{
 *   cartLine: import('../api/saleReceiptMapper').CartLine,
 *   onChangeQuantity: (menuItemId: string|number, nextQuantity: number) => void,
 *   onRemove: (menuItemId: string|number) => void,
 *   isEditingLocked?: boolean,
 * }} props
 */
export function CartLineItem({ cartLine, onChangeQuantity, onRemove, isEditingLocked = false }) {
  const { menuItem, quantity, lineTotal, exceedsStock } = cartLine;

  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{menuItem.name}</p>
        {exceedsStock ? (
          <p className="text-xs font-medium text-destructive" role="alert">
            Only {menuItem.stock} left — reduce the quantity
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{formatCurrency(menuItem.price)} each</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Remove one ${menuItem.name}`}
          disabled={isEditingLocked}
          onClick={() => onChangeQuantity(menuItem.menuItemId, quantity - 1)}
        >
          <Minus />
        </Button>
        <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={`Add one ${menuItem.name}`}
          disabled={isEditingLocked}
          onClick={() => onChangeQuantity(menuItem.menuItemId, quantity + 1)}
        >
          <Plus />
        </Button>
      </div>
      <strong className="w-20 text-right text-sm tabular-nums">{formatCurrency(lineTotal)}</strong>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        aria-label={`Remove ${menuItem.name} from order`}
        disabled={isEditingLocked}
        onClick={() => onRemove(menuItem.menuItemId)}
      >
        <Trash2 />
      </Button>
    </li>
  );
}
