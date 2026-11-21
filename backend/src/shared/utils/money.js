// Prisma Decimal → "250.00". Money is always returned to clients as a 2-decimal string.
function toMoney(value) {
  return value == null ? null : value.toFixed(2);
}

// Rule 7: effective price = priceOverride ?? basePrice.
function effectivePrice(priceOverride, basePrice) {
  return toMoney(priceOverride ?? basePrice);
}

// JS number → exact decimal string for Prisma ("19.9" → "19.90"). null/undefined pass through.
function toDbMoney(value) {
  return value == null ? value : value.toFixed(2);
}

module.exports = { toMoney, effectivePrice, toDbMoney };
