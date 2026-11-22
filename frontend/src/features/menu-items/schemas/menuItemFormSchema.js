import { z } from 'zod';
import { toMoneyString } from '@/lib/formatters';

const isNonNegativeNumber = (numericText) =>
  Number.isFinite(Number(numericText)) && Number(numericText) >= 0;

export const menuItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  sku: z.string().trim(),
  category: z.string().trim(),
  basePrice: z
    .string()
    .trim()
    .min(1, 'Base price is required')
    .refine(isNonNegativeNumber, 'Enter a price of 0 or more'),
  isActive: z.boolean(),
});

export const MENU_ITEM_FORM_DEFAULT_VALUES = {
  name: '',
  sku: '',
  category: '',
  basePrice: '',
  isActive: true,
};

/** Form values for editing an existing item, or empty defaults for a new one. */
export function getMenuItemFormValues(menuItemToEdit) {
  if (!menuItemToEdit) return MENU_ITEM_FORM_DEFAULT_VALUES;
  return {
    name: menuItemToEdit.name ?? '',
    sku: menuItemToEdit.sku ?? '',
    category: menuItemToEdit.category ?? '',
    basePrice: String(menuItemToEdit.basePrice ?? ''),
    isActive: menuItemToEdit.isActive ?? true,
  };
}

/** Converts validated form values to the API payload (optional blanks are omitted). */
export function toMenuItemPayload(menuItemFormValues) {
  const { sku, category, basePrice, ...requiredFields } = menuItemFormValues;
  return {
    ...requiredFields,
    basePrice: toMoneyString(basePrice),
    ...(sku && { sku }),
    ...(category && { category }),
  };
}
