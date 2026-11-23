// Container startup: seed only a fresh DB. prisma/seed.js re-applies catalog data
// (prices, names, assignments), so running it on every restart would undo HQ edits.
require("dotenv").config({ quiet: true });
const prisma = require("../src/shared/db/prisma");

async function main() {
  const outlets = await prisma.outlet.count();
  if (outlets > 0) {
    console.log(`DB already has data (${outlets} outlets), skipping seed.`);
    await prisma.$disconnect();
    return;
  }
  console.log("Empty DB, running seed...");
  require("../prisma/seed"); // runs main() and disconnects itself
}

main().catch(async (err) => {
  console.error("seed-if-empty failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
