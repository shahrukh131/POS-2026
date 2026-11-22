import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { canSellMenuItem, getStockLabel, isLowStock } from '../utils/menuItemAvailability';

/**
 * Tappable menu tile. Disabled when the item is unavailable or out of stock.
 * @param {{
 *   menuItem: import('@/lib/api/responseMappers').OutletMenuItem,
 *   cartQuantity: number,
 *   onAddToCart: (menuItem: import('@/lib/api/responseMappers').OutletMenuItem) => void,
 * }} props
 */
export function MenuItemTile({ menuItem, cartQuantity, onAddToCart }) {
  const isSellable = canSellMenuItem(menuItem);
  const stockLabel = getStockLabel(menuItem);

  return (
    <button
      type="button"
      disabled={!isSellable}
      onClick={() => onAddToCart(menuItem)}
      className={cn(
        'relative flex min-h-28 flex-col items-start gap-1 rounded-xl border bg-card p-4 text-left shadow-xs transition',
        'hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:shadow-xs',
      )}
    >
      {cartQuantity > 0 && (
        <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {cartQuantity}
        </span>
      )}
      <span className="pr-6 font-medium leading-snug">{menuItem.name}</span>
      <span className="text-sm font-semibold tabular-nums">{formatCurrency(menuItem.price)}</span>
      {stockLabel && (
        <span
          className={cn(
            'mt-auto text-xs text-muted-foreground',
            isSellable && isLowStock(menuItem) && 'font-medium text-warning',
            !isSellable && 'text-destructive',
          )}
        >
          {stockLabel}
        </span>
      )}
    </button>
  );
}
