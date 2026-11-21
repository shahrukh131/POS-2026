const prisma = require("../../shared/db/prisma");

function create(data, db = prisma) {
  return db.menuItem.create({ data });
}

function findAll({ isActive } = {}, db = prisma) {
  return db.menuItem.findMany({
    where: isActive === undefined ? {} : { isActive },
    orderBy: { id: "asc" },
  });
}

function findById(id, db = prisma) {
  return db.menuItem.findUnique({ where: { id } });
}

function update(id, data, db = prisma) {
  return db.menuItem.update({ where: { id }, data });
}

module.exports = { create, findAll, findById, update };
