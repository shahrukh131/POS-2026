import { z } from 'zod';
import { STOCK_CHANGE_TYPES } from '../constants';

export const STOCK_CHANGE_FORM_DEFAULT_VALUES = { quantityChange: '', note: '' };

/**
 * Validation depends on the change type and the row's current stock, so the schema is built per dialog.
 * - restock: positive whole number, note optional
 * - adjust: non-zero whole number (negative for waste), reason required
 * - both: resulting stock may not go below 0
 *
 * @param {{ changeType: 'restock' | 'adjust', currentStock: number }} options
 */
export function createStockChangeFormSchema({ changeType, currentStock }) {
  const isRestock = changeType === STOCK_CHANGE_TYPES.RESTOCK;

  const quantityChangeSchema = z
    .string()
    .trim()
    .min(1, 'Enter a quantity')
    .refine((quantityText) => Number.isInteger(Number(quantityText)), 'Enter a whole number')
    .refine(
      (quantityText) => (isRestock ? Number(quantityText) > 0 : Number(quantityText) !== 0),
      isRestock ? 'Enter a positive whole number' : 'Enter a non-zero whole number (e.g. -3 or 5)',
    )
    .refine((quantityText) => currentStock + Number(quantityText) >= 0, 'Stock cannot go below 0');

  return z.object({
    quantityChange: quantityChangeSchema,
    note: isRestock ? z.string().trim() : z.string().trim().min(1, 'Reason is required'),
  });
}
