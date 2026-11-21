const prisma = require("../config/prisma");

function ping() {
  return prisma.$queryRaw`SELECT 1`;
}

module.exports = { ping };
