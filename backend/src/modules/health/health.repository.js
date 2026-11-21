const prisma = require("../../shared/db/prisma");

function ping() {
  return prisma.$queryRaw`SELECT 1`;
}

module.exports = { ping };
