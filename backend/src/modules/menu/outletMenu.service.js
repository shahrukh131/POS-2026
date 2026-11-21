const assignmentRepository = require("./assignment.repository");
const outletModule = require("../outlet");
const { effectivePrice } = require("../../shared/utils/money");

function toMenuDto(row) {
  const stock = Number(row.stock);
  return {
    menuItemId: row.menuItemId,
    sku: row.sku,
    name: row.name,
    price: effectivePrice(row.priceOverride, row.basePrice), // rule 7
    stock,
    inStock: stock > 0,
  };
}

// Rules 7–9. Normal path = 1 query. The outlet lookup only runs when the menu is empty,
// to tell "unknown outlet" (404) apart from "nothing sellable right now" ([]).
async function getMenu(outletId) {
  const rows = await assignmentRepository.findSellableByOutlet(outletId);
  if (rows.length === 0) {
    await outletModule.ensureExists(outletId);
    return [];
  }
  return rows.map(toMenuDto);
}

module.exports = { getMenu };
