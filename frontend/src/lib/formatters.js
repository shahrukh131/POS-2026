const CURRENCY_SYMBOL = '৳';
export const EMPTY_VALUE_PLACEHOLDER = '—';

/** "1250" → "৳ 1,250.00". Money arrives from the API as strings. */
export function formatCurrency(amount) {
  const numericAmount = Number(amount);
  if (amount == null || Number.isNaN(numericAmount)) return EMPTY_VALUE_PLACEHOLDER;
  const formattedAmount = numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_SYMBOL} ${formattedAmount}`;
}

export const formatDate = (isoDateString) =>
  isoDateString ? new Date(isoDateString).toLocaleDateString() : EMPTY_VALUE_PLACEHOLDER;

export const formatDateTime = (isoDateString) =>
  isoDateString ? new Date(isoDateString).toLocaleString() : EMPTY_VALUE_PLACEHOLDER;

/** Money string with exactly two decimals, as the backend expects ("12" → "12.00"). */
export const toMoneyString = (amount) => Number(amount).toFixed(2);
