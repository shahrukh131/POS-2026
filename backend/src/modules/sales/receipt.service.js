const outletModule = require("../outlet");

// Rule 26: <OUTLET_CODE>-<6 digits>, e.g. DHA-000001.
const formatReceipt = (code, n) => `${code}-${String(n).padStart(6, "0")}`;

// Rules 26–28: the outlet's counter is incremented inside the sale's tx (row lock until commit).
// Call it LAST in the sale (lock order), so a failed sale never uses up a number.
async function nextReceiptNumber(outlet, db) {
  const n = await outletModule.nextReceiptNumber(outlet.id, db);
  return formatReceipt(outlet.code, n);
}

module.exports = { nextReceiptNumber };
