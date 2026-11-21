const prisma = require("../config/prisma");
const outletRepository = require("../repositories/outlet.repository");
const AppError = require("../utils/AppError");

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

async function getOutlet(id) {
  const outlet = await outletRepository.findById(id);
  if (!outlet) throw new AppError(404, "OUTLET_NOT_FOUND", `Outlet ${id} not found`);
  return outlet;
}

// Only name/location reach here: the validator rejects `code` (immutable, printed on receipts).
async function updateOutlet(id, data) {
  await getOutlet(id);
  return outletRepository.update(id, data);
}

module.exports = { createOutlet, listOutlets, getOutlet, updateOutlet };
