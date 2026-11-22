import { z } from 'zod';

// Limits mirror backend/src/modules/outlet/outlet.validator.js so errors show inline, not as a toast.
export const OUTLET_CODE_MAX_LENGTH = 10;
const OUTLET_NAME_MAX_LENGTH = 100;
const OUTLET_ADDRESS_MAX_LENGTH = 255;
const OUTLET_CODE_PATTERN = /^[A-Za-z]{2,10}$/;

export const outletFormSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(OUTLET_CODE_PATTERN, 'Code must be 2–10 letters (A–Z)')
    .transform((outletCode) => outletCode.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(OUTLET_NAME_MAX_LENGTH, `Name must be ${OUTLET_NAME_MAX_LENGTH} characters or fewer`),
  address: z
    .string()
    .trim()
    .max(OUTLET_ADDRESS_MAX_LENGTH, `Address must be ${OUTLET_ADDRESS_MAX_LENGTH} characters or fewer`),
});

export const OUTLET_FORM_DEFAULT_VALUES = { code: '', name: '', address: '' };

/** Form values for editing an existing outlet, or empty defaults for a new one. */
export function getOutletFormValues(outletToEdit) {
  if (!outletToEdit) return OUTLET_FORM_DEFAULT_VALUES;
  return { code: outletToEdit.code ?? '', name: outletToEdit.name ?? '', address: outletToEdit.address ?? '' };
}

/** The backend calls the address `location`; a blank address is omitted on create. */
export const toCreateOutletPayload = ({ code, name, address }) => ({
  code,
  name,
  ...(address && { location: address }),
});

/** Code is immutable after creation; a blank address clears it (`null`). */
export const toUpdateOutletPayload = ({ name, address }) => ({
  name,
  location: address || null,
});
