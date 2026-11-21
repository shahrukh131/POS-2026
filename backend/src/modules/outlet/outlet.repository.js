const prisma = require("../../shared/db/prisma");

function create(data, db = prisma) {
  return db.outlet.create({ data });
}

function createReceiptCounter(outletId, db = prisma) {
  return db.receiptCounter.create({ data: { outletId, lastNumber: 0 } });
}

function findAll(db = prisma) {
  return db.outlet.findMany({ orderBy: { id: "asc" } });
}

function findById(id, db = prisma) {
  return db.outlet.findUnique({ where: { id } });
}

function update(id, data, db = prisma) {
  return db.outlet.update({ where: { id }, data });
}

// Rules 26–27: atomic +1 on the outlet's counter row (row lock held until commit). Returns the new lastNumber.
async function incrementReceiptCounter(outletId, db = prisma) {
  const counter = await db.receiptCounter.update({
    where: { outletId },
    data: { lastNumber: { increment: 1 } },
  });
  return counter.lastNumber;
}

module.exports = { create, createReceiptCounter, findAll, findById, update, incrementReceiptCounter };
