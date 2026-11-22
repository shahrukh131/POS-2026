import { EmptyState } from '@/components/common/EmptyState';
import { MenuItemTile } from './MenuItemTile';

/**
 * @param {{
 *   menuItems: import('@/lib/api/responseMappers').OutletMenuItem[],
 *   menuSearchText: string,
 *   getCartQuantity: (menuItemId: string|number) => number,
 *   onAddToCart: (menuItem: import('@/lib/api/responseMappers').OutletMenuItem) => void,
 * }} props
 */
export function MenuItemGrid({ menuItems, menuSearchText, getCartQuantity, onAddToCart }) {
  if (!menuItems.length) return <EmptyState message={`No items match “${menuSearchText}”.`} />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {menuItems.map((menuItem) => (
        <MenuItemTile
          key={menuItem.menuItemId}
          menuItem={menuItem}
          cartQuantity={getCartQuantity(menuItem.menuItemId)}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
