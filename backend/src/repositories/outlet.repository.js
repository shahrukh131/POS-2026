const prisma = require("../config/prisma");

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

module.exports = { create, createReceiptCounter, findAll, findById, update };
