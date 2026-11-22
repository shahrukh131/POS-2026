import { useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTP_STATUS } from '@/lib/api/httpClient';
import { QUERY_KEY_ROOTS, queryKeys } from '@/lib/api/queryKeys';
import { generateClientId } from '@/lib/generateClientId';
import { createSale } from '../api/posApi';
import { mapSaleReceiptFromApi } from '../api/saleReceiptMapper';

/**
 * Checkout with idempotency:
 * - One `clientId` per sale attempt. It is reused when a request fails on the network or with a 5xx,
 *   so a retry can never create a double sale.
 * - A new `clientId` is generated after success, or after a 409 (insufficient stock), because the
 *   cart has to change and that makes it a new sale.
 * - While a network/5xx failure is unresolved (`hasUnresolvedFailure`), the caller must lock cart edits:
 *   a retry with the same `clientId` has to send the same items. `discardFailedAttempt()` starts over.
 */
export function useCheckoutMutation(outletId) {
  const queryClient = useQueryClient();
  const saleClientIdRef = useRef(generateClientId());

  const checkoutMutation = useMutation({
    /** @param {import('../api/saleReceiptMapper').CartLine[]} cartLines */
    mutationFn: async (cartLines) => {
      const createSaleResponse = await createSale(outletId, {
        clientId: saleClientIdRef.current,
        items: cartLines.map((cartLine) => ({
          menuItemId: cartLine.menuItem.menuItemId,
          quantity: cartLine.quantity,
        })),
      });
      return mapSaleReceiptFromApi(createSaleResponse, cartLines);
    },
    onSuccess: () => {
      saleClientIdRef.current = generateClientId();
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.outletMenu(outletId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory(outletId) }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ROOTS.REVENUE_REPORT] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ROOTS.TOP_ITEMS] }),
      ]);
    },
    onError: (checkoutError) => {
      if (checkoutError.status !== HTTP_STATUS.CONFLICT) return; // keep the clientId so a retry is safe
      saleClientIdRef.current = generateClientId();
      return queryClient.invalidateQueries({ queryKey: queryKeys.outletMenu(outletId) });
    },
  });

  const { reset: resetCheckoutMutation } = checkoutMutation;
  const isStockConflict = checkoutMutation.isError && checkoutMutation.error?.status === HTTP_STATUS.CONFLICT;

  /** Gives up on the failed attempt so the cart can be edited. Risky only if it actually reached the server. */
  const discardFailedAttempt = useCallback(() => {
    saleClientIdRef.current = generateClientId();
    resetCheckoutMutation();
  }, [resetCheckoutMutation]);

  return {
    ...checkoutMutation,
    isStockConflict,
    hasUnresolvedFailure: checkoutMutation.isError && !isStockConflict,
    discardFailedAttempt,
  };
}
