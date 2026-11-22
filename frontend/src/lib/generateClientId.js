/** RFC 4122 v4 UUID. Used as the idempotency key for POS sales. */
export function generateClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (placeholderChar) => {
    const randomNibble = (Math.random() * 16) | 0;
    const hexValue = placeholderChar === 'x' ? randomNibble : (randomNibble & 0x3) | 0x8;
    return hexValue.toString(16);
  });
}
