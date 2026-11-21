const { Prisma } = require("@prisma/client");
const prisma = require("../../shared/db/prisma");
const assignmentRepository = require("./assignment.repository");
const inventoryModule = require("../inventory");
const outletModule = require("../outlet");
const menuItemRepository = require("./menuItem.repository");
const AppError = require("../../shared/utils/AppError");
const { toMoney, effectivePrice, toDbMoney } = require("../../shared/utils/money");

function toAssignmentDto(row) {
  return {
    outletId: row.outletId,
    menuItemId: row.menuItemId,
    sku: row.menuItem.sku,
    name: row.menuItem.name,
    isActive: row.menuItem.isActive,
    basePrice: toMoney(row.menuItem.basePrice),
    priceOverride: toMoney(row.priceOverride),
    effectivePrice: effectivePrice(row.priceOverride, row.menuItem.basePrice),
    isAvailable: row.isAvailable,
    stock: row.inventory?.quantity ?? 0,
  };
}

const ensureOutlet = (outletId, db) => outletModule.ensureExists(outletId, db);

const alreadyAssigned = (outletId, menuItemId) =>
  new AppError(
    409,
    "ALREADY_ASSIGNED",
    `Menu item ${menuItemId} is already assigned to outlet ${outletId}. To re-enable it, PATCH isAvailable=true.`
  );

// Rules 4–5: assignment + inventory row (qty 0) in ONE transaction.
async function assignMenuItem(outletId, { menuItemId, priceOverride }) {
  try {
    return await prisma.$transaction(async (tx) => {
      await ensureOutlet(outletId, tx);

      const item = await menuItemRepository.findById(menuItemId, tx);
      if (!item) throw new AppError(404, "MENU_ITEM_NOT_FOUND", `Menu item ${menuItemId} not found`);
      if (!item.isActive) {
        throw new AppError(400, "MENU_ITEM_INACTIVE", `Menu item ${menuItemId} is inactive and can't be assigned`);
      }

      if (await assignmentRepository.findByKey(outletId, menuItemId, tx)) {
        throw alreadyAssigned(outletId, menuItemId);
      }

      await assignmentRepository.create(
        { outletId, menuItemId, priceOverride: toDbMoney(priceOverride) ?? null },
        tx
      );
      await inventoryModule.initStock(outletId, menuItemId, tx);

      return toAssignmentDto(await assignmentRepository.findByKey(outletId, menuItemId, tx));
    });
  } catch (err) {
    // Two concurrent POSTs both pass the check above; the unique index stops the second one.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw alreadyAssigned(outletId, menuItemId);
    }
    throw err;
  }
}

async function listAssignments(outletId) {
  await ensureOutlet(outletId);
  const rows = await assignmentRepository.findAllByOutlet(outletId);
  return rows.map(toAssignmentDto);
}

// Rule 6: priceOverride null clears it. Rule 10: isAvailable=false unassigns, true re-enables.
async function updateAssignment(outletId, menuItemId, { priceOverride, isAvailable }) {
  await ensureOutlet(outletId);
  if (!(await assignmentRepository.findByKey(outletId, menuItemId))) {
    throw new AppError(404, "NOT_ASSIGNED", `Menu item ${menuItemId} is not assigned to outlet ${outletId}`);
  }

  const data = {};
  if (priceOverride !== undefined) data.priceOverride = toDbMoney(priceOverride);
  if (isAvailable !== undefined) data.isAvailable = isAvailable;

  return toAssignmentDto(await assignmentRepository.update(outletId, menuItemId, data));
}

// ---- Public API (exported via ./index.js for other modules). `db` = optional tx.

// Rule 19: the sale's assignment rows (with menuItem) for the given ids. Missing ids are simply absent.
function findAssignmentsForSale(outletId, menuItemIds, db) {
  return assignmentRepository.findManyForSale(outletId, menuItemIds, db);
}

module.exports = { assignMenuItem, listAssignments, updateAssignment, findAssignmentsForSale };
