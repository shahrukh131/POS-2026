const menuItemRepository = require("./menuItem.repository");
const AppError = require("../../shared/utils/AppError");
const { toMoney, toDbMoney } = require("../../shared/utils/money");

function toMenuItemDto(item) {
  return { ...item, basePrice: toMoney(item.basePrice) };
}

// Send money to Prisma as an exact decimal string, not a JS float.
function toDbData(data) {
  const out = { ...data };
  if (out.basePrice !== undefined) out.basePrice = toDbMoney(out.basePrice);
  return out;
}

// Rule 3. Duplicate sku → P2002 → 409 DUPLICATE via errorHandler.
async function createMenuItem(data) {
  const item = await menuItemRepository.create(toDbData(data));
  return toMenuItemDto(item);
}

async function listMenuItems(filter) {
  const items = await menuItemRepository.findAll(filter);
  return items.map(toMenuItemDto);
}

async function findOrThrow(id) {
  const item = await menuItemRepository.findById(id);
  if (!item) throw new AppError(404, "MENU_ITEM_NOT_FOUND", `Menu item ${id} not found`);
  return item;
}

async function getMenuItem(id) {
  return toMenuItemDto(await findOrThrow(id));
}

// Rule 10: no delete; deactivate with isActive = false.
async function updateMenuItem(id, data) {
  await findOrThrow(id);
  const item = await menuItemRepository.update(id, toDbData(data));
  return toMenuItemDto(item);
}

module.exports = { createMenuItem, listMenuItems, getMenuItem, updateMenuItem };
