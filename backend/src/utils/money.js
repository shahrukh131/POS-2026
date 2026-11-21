// Prisma Decimal → "250.00". Money is always returned to clients as a 2-decimal string.
function toMoney(value) {
  return value == null ? null : value.toFixed(2);
}

module.exports = { toMoney };
