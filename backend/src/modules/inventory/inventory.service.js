const { Prisma } = require("@prisma/client");
const prisma = require("../../shared/db/prisma");
const inventoryRepository = require("./inventory.repository");
const inventoryLogRepository = require("./inventoryLog.repository");
const outletModule = require("../outlet");
const AppError = require("../../shared/utils/AppError");

const ensureOutlet = (outletId, db) => outletModule.ensureExists(outletId, db);

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

// Keyset pagination: `before` = id of the oldest log the client has, so deep pages cost the same as page 1.
async function listLogs(outletId, menuItemId, { limit, before, type }) {
  await ensureOutlet(outletId);
  if (!(await inventoryRepository.findByKey(outletId, menuItemId))) throw notAssigned(outletId, menuItemId);
  let cursor = null;
  if (before) {
    cursor = await inventoryLogRepository.findCursor(outletId, menuItemId, before);
    if (!cursor) throw new AppError(400, "INVALID_CURSOR", `Log ${before} does not belong to this outlet item`);
  }
  const logs = await inventoryLogRepository.findByItem(outletId, menuItemId, { limit, cursor, type });
  return logs.map(toLogDto);
}

// ---- Public API (exported via ./index.js for other modules). `db` = optional tx.

// Rule 5: called by menu when an item is assigned, inside the assignment's transaction.
function initStock(outletId, menuItemId, db) {
  return inventoryRepository.create({ outletId, menuItemId, quantity: 0 }, db);
}

// Rule 20: conditional atomic decrement. Returns rows changed (0 = short or no row). Locks the row until commit.
function deductStock(outletId, menuItemId, quantity, db) {
  return inventoryRepository.deduct(outletId, menuItemId, quantity, db);
}

// Current quantity, or null if there is no inventory row.
async function getQuantity(outletId, menuItemId, db) {
  const row = await inventoryRepository.findByKey(outletId, menuItemId, db);
  return row ? row.quantity : null;
}

// Rule 23: SALE logs, written in the sale's transaction.
function writeLogs(rows, db) {
  return inventoryLogRepository.createMany(rows, db);
}

module.exports = { listInventory, restock, adjust, listLogs, initStock, deductStock, getQuantity, writeLogs };
