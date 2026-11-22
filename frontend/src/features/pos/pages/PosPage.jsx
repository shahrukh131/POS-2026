import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { OutletCodeTag } from '@/components/common/OutletCodeTag';
import { QueryStateBoundary } from '@/components/common/QueryStateBoundary';
import { Input } from '@/components/ui/input';
import { useViewAs } from '@/features/view-as/hooks/useViewAs';
import { HTTP_STATUS } from '@/lib/api/httpClient';
import { CartPanel } from '../components/CartPanel';
import { ConfirmSaleDialog } from '../components/ConfirmSaleDialog';
import { MenuItemGrid } from '../components/MenuItemGrid';
import { SaleReceiptDialog } from '../components/SaleReceiptDialog';
import { useCheckoutMutation } from '../hooks/useCheckoutMutation';
import { useOutletMenuQuery } from '../hooks/useOutletMenuQuery';
import { usePosCart } from '../hooks/usePosCart';

export function PosPage() {
  const { viewAs } = useViewAs();
  const { outletId, outletName, outletCode } = viewAs;

  const outletMenuQuery = useOutletMenuQuery(outletId);
  const outletMenuItems = outletMenuQuery.data ?? [];
  const posCart = usePosCart(outletMenuItems);
  const checkoutMutation = useCheckoutMutation(outletId);

  const [menuSearchText, setMenuSearchText] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [completedSaleReceipt, setCompletedSaleReceipt] = useState(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  // While a failed attempt is unresolved the cart must not change: a retry re-sends the same clientId.
  const isCartEditingLocked = checkoutMutation.hasUnresolvedFailure || checkoutMutation.isPending;

  const normalizedSearchText = menuSearchText.trim().toLowerCase();
  const filteredMenuItems = outletMenuItems.filter((menuItem) =>
    menuItem.name.toLowerCase().includes(normalizedSearchText),
  );

  // Removing the last line inside the review closes it — there is nothing left to confirm.
  const hasCartLines = posCart.hasCartLines;
  useEffect(() => {
    if (!hasCartLines) setIsConfirmDialogOpen(false);
  }, [hasCartLines]);

  const handleAddToCart = (menuItem) => {
    if (isCartEditingLocked) {
      toast.info('Finish or discard the pending checkout before adding items.');
      setIsConfirmDialogOpen(true);
      return;
    }
    posCart.addMenuItemToCart(menuItem);
  };

  const handleReviewOrder = () => {
    // A stale "not enough stock" alert from an earlier attempt shouldn't greet a fresh review.
    if (checkoutMutation.isStockConflict) checkoutMutation.reset();
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmSale = () => {
    if (!posCart.hasCartLines || posCart.hasStockProblems) return;
    checkoutMutation.mutate(posCart.cartLines, {
      onSuccess: (saleReceipt) => {
        setIsConfirmDialogOpen(false);
        setCompletedSaleReceipt(saleReceipt);
        setIsReceiptDialogOpen(true);
        posCart.clearCart();
      },
      onError: (checkoutError) => {
        if (checkoutError.status === HTTP_STATUS.CONFLICT) {
          toast.error('Not enough stock. Menu refreshed — adjust the flagged items.');
        } else {
          toast.error(`Checkout failed: ${checkoutError.message}`);
        }
      },
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {outletName} <OutletCodeTag outletCode={outletCode} />
          </h1>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search menu…"
              aria-label="Search menu"
              className="bg-card pl-9"
              value={menuSearchText}
              onChange={(changeEvent) => setMenuSearchText(changeEvent.target.value)}
            />
          </div>
        </div>
        <QueryStateBoundary
          queryState={outletMenuQuery}
          isEmpty={!outletMenuItems.length}
          emptyMessage="No items are assigned to this outlet yet. Ask HQ to assign the menu."
        >
          <MenuItemGrid
            menuItems={filteredMenuItems}
            menuSearchText={menuSearchText}
            getCartQuantity={posCart.getCartQuantity}
            onAddToCart={handleAddToCart}
          />
        </QueryStateBoundary>
      </section>

      <aside>
        <CartPanel
          cartLines={posCart.cartLines}
          cartTotal={posCart.cartTotal}
          isEditingLocked={isCartEditingLocked}
          onChangeQuantity={posCart.setCartLineQuantity}
          onRemoveLine={posCart.removeCartLine}
          onReviewOrder={handleReviewOrder}
          onClearCart={posCart.clearCart}
        />
      </aside>

      <ConfirmSaleDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        cartLines={posCart.cartLines}
        cartTotal={posCart.cartTotal}
        itemCount={posCart.itemCount}
        hasStockProblems={posCart.hasStockProblems}
        onChangeQuantity={posCart.setCartLineQuantity}
        onRemoveLine={posCart.removeCartLine}
        onConfirmSale={handleConfirmSale}
        isCheckingOut={checkoutMutation.isPending}
        isStockConflict={checkoutMutation.isStockConflict}
        hasUnresolvedFailure={checkoutMutation.hasUnresolvedFailure}
        failureMessage={checkoutMutation.error?.message}
        onDiscardFailedAttempt={checkoutMutation.discardFailedAttempt}
      />

      <SaleReceiptDialog
        saleReceipt={completedSaleReceipt}
        outletName={outletName}
        outletCode={outletCode}
        isOpen={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
      />
    </div>
  );
}
