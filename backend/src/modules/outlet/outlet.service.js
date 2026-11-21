const prisma = require("../../shared/db/prisma");
const outletRepository = require("./outlet.repository");
const AppError = require("../../shared/utils/AppError");

// Rules 1–2: outlet and its receipt counter (lastNumber 0) are created atomically.
// Duplicate name/code → P2002 → 409 DUPLICATE via errorHandler.
function createOutlet(data) {
  return prisma.$transaction(async (tx) => {
    const outlet = await outletRepository.create(data, tx);
    await outletRepository.createReceiptCounter(outlet.id, tx);
    return outlet;
  });
}

function listOutlets() {
  return outletRepository.findAll();
}

// ---- Public API (exported via ./index.js for other modules). `db` = optional tx.

function findById(id, db) {
  return outletRepository.findById(id, db);
}

async function ensureExists(id, db) {
  const outlet = await outletRepository.findById(id, db);
  if (!outlet) throw new AppError(404, "OUTLET_NOT_FOUND", `Outlet ${id} not found`);
  return outlet;
}

// Rules 26–27: atomic +1 on the outlet's counter row (row lock held until commit). Returns the new number.
function nextReceiptNumber(outletId, db) {
  return outletRepository.incrementReceiptCounter(outletId, db);
}

// ---- HQ endpoints

function getOutlet(id) {
  return ensureExists(id);
}

// Only name/location reach here: the validator rejects `code` (immutable, printed on receipts).
async function updateOutlet(id, data) {
  await getOutlet(id);
  return outletRepository.update(id, data);
}

module.exports = { createOutlet, listOutlets, getOutlet, updateOutlet, findById, ensureExists, nextReceiptNumber };
