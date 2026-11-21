const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const inventoryRepository = require("../repositories/inventory.repository");
const inventoryLogRepository = require("../repositories/inventoryLog.repository");
const outletRepository = require("../repositories/outlet.repository");
const AppError = require("../utils/AppError");

async function ensureOutlet(outletId, db) {
  const outlet = await outletRepository.findById(outletId, db);
  if (!outlet) throw new AppError(404, "OUTLET_NOT_FOUND", `Outlet ${outletId} not found`);
  return outlet;
}

const notAssigned = (outletId, menuItemId) =>
  new AppError(404, "NOT_ASSIGNED", `Menu item ${menuItemId} is not assigned to outlet ${outletId}`);

function toStockDto(row) {
  const { menuItem, isAvailable } = row.outletMenuItem;
  return {
    menuItemId: row.menuItemId,
    sku: menuItem.sku,
    name: menuItem.name,
    quantity: row.quantity,
    isAvailable,
    isActive: menuItem.isActive,
    updatedAt: row.updatedAt,
  };
}

function toLogDto(log) {
  return {
    id: log.id,
    changeType: log.changeType,
    quantityChange: log.quantityChange,
    balanceAfter: log.balanceAfter,
    saleId: log.saleId,
    note: log.note,
    createdAt: log.createdAt,
  };
}

// Rule 11: stock per assigned item (unavailable ones included, flagged).
async function listInventory(outletId) {
  await ensureOutlet(outletId);
  const rows = await inventoryRepository.findAllByOutlet(outletId);
  return rows.map(toStockDto);
}

// Rule 14 + 16: atomic increment + RESTOCK log in ONE transaction.
// balanceAfter comes from the UPDATE ... RETURNING result, never from a JS calculation.
async function restock(outletId, menuItemId, { quantity, note }) {
  try {
    return await prisma.$transaction(async (tx) => {
      await ensureOutlet(outletId, tx);
      const row = await inventoryRepository.increment(outletId, menuItemId, quantity, tx);
      const log = await inventoryLogRepository.create(
        {
          outletId,
          menuItemId,
          changeType: "RESTOCK",
          quantityChange: quantity,
          balanceAfter: row.quantity,
          note,
        },
        tx
      );
      return { menuItemId, quantity: row.quantity, log: toLogDto(log) };
    });
  } catch (err) {
    // No inventory row = item not assigned to this outlet (rule 12).
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw notAssigned(outletId, menuItemId);
    }
    throw err;
  }
}

// Rule 15 + 16: set an absolute quantity. The row is locked (FOR UPDATE) so the old value can't
// change between read and write; delta = new − old. No change → no log.
function adjust(outletId, menuItemId, { quantity, note }) {
  return prisma.$transaction(async (tx) => {
    await ensureOutlet(outletId, tx);

    const locked = await inventoryRepository.lockForUpdate(outletId, menuItemId, tx);
    if (!locked) throw notAssigned(outletId, menuItemId);

    const delta = quantity - locked.quantity;
    if (delta === 0) return { menuItemId, quantity: locked.quantity, log: null };

    const row = await inventoryRepository.setQuantity(outletId, menuItemId, quantity, tx);
    const log = await inventoryLogRepository.create(
      {
        outletId,
        menuItemId,
        changeType: "ADJUSTMENT",
        quantityChange: delta,
        balanceAfter: row.quantity,
        note,
      },
      tx
    );
    return { menuItemId, quantity: row.quantity, log: toLogDto(log) };
  });
}

async function listLogs(outletId, menuItemId, { limit }) {
  await ensureOutlet(outletId);
  if (!(await inventoryRepository.findByKey(outletId, menuItemId))) throw notAssigned(outletId, menuItemId);
  const logs = await inventoryLogRepository.findByItem(outletId, menuItemId, limit);
  return logs.map(toLogDto);
}

module.exports = { listInventory, restock, adjust, listLogs };
