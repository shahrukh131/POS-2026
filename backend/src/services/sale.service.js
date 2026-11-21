const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const saleRepository = require("../repositories/sale.repository");
const assignmentRepository = require("../repositories/assignment.repository");
const inventoryRepository = require("../repositories/inventory.repository");
const inventoryLogRepository = require("../repositories/inventoryLog.repository");
const outletRepository = require("../repositories/outlet.repository");
const AppError = require("../utils/AppError");
const { toMoney } = require("../utils/money");

// Waiting for row locks under load is normal; don't fail a sale because the pool/locks are briefly busy.
const TX_OPTIONS = { maxWait: 5000, timeout: 10000 };

function toSaleDto(sale) {
  return {
    id: sale.id,
    outletId: sale.outletId,
    receiptNumber: sale.receiptNumber,
    clientId: sale.clientId,
    totalAmount: toMoney(sale.totalAmount),
    createdAt: sale.createdAt,
    items: sale.items.map((it) => ({
      menuItemId: it.menuItemId,
      sku: it.menuItem.sku,
      name: it.menuItem.name,
      quantity: it.quantity,
      unitPrice: toMoney(it.unitPrice),
      lineTotal: toMoney(it.lineTotal),
    })),
  };
}

// Rule 18: merge duplicate lines, then sort by menuItemId ascending (= lock order, prevents deadlocks).
function mergeLines(items) {
  const qtyById = new Map();
  for (const { menuItemId, quantity } of items) {
    qtyById.set(menuItemId, (qtyById.get(menuItemId) ?? 0) + quantity);
  }
  return [...qtyById.entries()]
    .map(([menuItemId, quantity]) => ({ menuItemId, quantity }))
    .sort((a, b) => a.menuItemId - b.menuItemId);
}

const formatReceipt = (code, n) => `${code}-${String(n).padStart(6, "0")}`;

// Rule 25: an existing sale with this clientId is returned as-is, but only to the outlet that made it.
function replayOrConflict(existing, outletId, clientId) {
  if (existing.outletId !== outletId) {
    throw new AppError(409, "CLIENT_ID_CONFLICT", `clientId ${clientId} was already used by another outlet`);
  }
  return { sale: toSaleDto(existing), replayed: true };
}

const isClientIdDuplicate = (err) =>
  err instanceof Prisma.PrismaClientKnownRequestError &&
  err.code === "P2002" &&
  String(err.meta?.target ?? "").toLowerCase().includes("client");

// Rules 17–28. Lock order (ARCHITECTURE.md): stock rows ascending → receipt counter LAST → inserts.
async function createSale(outletId, { items, clientId }) {
  const lines = mergeLines(items);

  if (clientId) {
    const existing = await saleRepository.findByClientId(clientId);
    if (existing) return replayOrConflict(existing, outletId, clientId);
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      // a. Outlet + assignments (rule 19)
      const outlet = await outletRepository.findById(outletId, tx);
      if (!outlet) throw new AppError(404, "OUTLET_NOT_FOUND", `Outlet ${outletId} not found`);

      const ids = lines.map((l) => l.menuItemId);
      const assignments = await assignmentRepository.findManyForSale(outletId, ids, tx);
      const byId = new Map(assignments.map((a) => [a.menuItemId, a]));

      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length) {
        throw new AppError(404, "NOT_ASSIGNED", `Menu item(s) ${missing.join(", ")} not assigned to outlet ${outletId}`, {
          menuItemIds: missing,
        });
      }

      const notSellable = assignments
        .filter((a) => !a.menuItem.isActive || !a.isAvailable)
        .map((a) => ({ menuItemId: a.menuItemId, reason: !a.menuItem.isActive ? "INACTIVE" : "UNAVAILABLE" }));
      if (notSellable.length) {
        throw new AppError(400, "ITEM_NOT_SELLABLE", "Some items are inactive or unavailable at this outlet", {
          items: notSellable,
        });
      }

      // b. Prices from the DB, Decimal math only (rules 21–22)
      let total = new Prisma.Decimal(0);
      const priced = lines.map((l) => {
        const a = byId.get(l.menuItemId);
        const unitPrice = new Prisma.Decimal(a.priceOverride ?? a.menuItem.basePrice);
        const lineTotal = unitPrice.mul(l.quantity);
        total = total.add(lineTotal);
        return { ...l, sku: a.menuItem.sku, unitPrice, lineTotal };
      });

      // c. Deduct stock, ascending menuItemId (rule 20). Short → 409, whole tx rolls back.
      for (const line of priced) {
        const count = await inventoryRepository.deduct(outletId, line.menuItemId, line.quantity, tx);
        if (count === 0) {
          const inv = await inventoryRepository.findByKey(outletId, line.menuItemId, tx);
          throw new AppError(409, "INSUFFICIENT_STOCK", `Not enough stock for ${line.sku}`, {
            menuItemId: line.menuItemId,
            sku: line.sku,
            requested: line.quantity,
            available: inv?.quantity ?? 0,
          });
        }
        // Our UPDATE holds this row's lock until commit, so this read is the exact post-sale balance.
        line.balanceAfter = (await inventoryRepository.findByKey(outletId, line.menuItemId, tx)).quantity;
      }

      // d. Receipt counter LAST (rules 26–28): a short sale never reaches here, so no number is used up.
      const n = await outletRepository.incrementReceiptCounter(outletId, tx);

      // e. Sale + items
      const created = await saleRepository.create(
        {
          outletId,
          receiptNumber: formatReceipt(outlet.code, n),
          clientId: clientId ?? null,
          totalAmount: total.toFixed(2),
          items: {
            create: priced.map((l) => ({
              menuItemId: l.menuItemId,
              quantity: l.quantity,
              unitPrice: l.unitPrice.toFixed(2),
              lineTotal: l.lineTotal.toFixed(2),
            })),
          },
        },
        tx
      );

      // f. SALE logs (rule 23)
      await inventoryLogRepository.createMany(
        priced.map((l) => ({
          outletId,
          menuItemId: l.menuItemId,
          changeType: "SALE",
          quantityChange: -l.quantity,
          balanceAfter: l.balanceAfter,
          saleId: created.id,
        })),
        tx
      );

      return created;
    }, TX_OPTIONS);

    return { sale: toSaleDto(sale), replayed: false };
  } catch (err) {
    // Same clientId raced: the loser's tx rolled back (stock + receipt number undone); return the winner.
    if (clientId && isClientIdDuplicate(err)) {
      const existing = await saleRepository.findByClientId(clientId);
      if (existing) return replayOrConflict(existing, outletId, clientId);
    }
    throw err;
  }
}

async function getSale(outletId, saleId) {
  const sale = await saleRepository.findByIdInOutlet(saleId, outletId);
  if (sale) return toSaleDto(sale);
  const outlet = await outletRepository.findById(outletId);
  if (!outlet) throw new AppError(404, "OUTLET_NOT_FOUND", `Outlet ${outletId} not found`);
  throw new AppError(404, "SALE_NOT_FOUND", `Sale ${saleId} not found in outlet ${outletId}`);
}

module.exports = { createSale, getSale };
