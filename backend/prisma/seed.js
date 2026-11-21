// Demo seed: outlets, receipt counters, master menu, assignments, inventory, RESTOCK logs.
// Idempotent: catalog data (menu, prices, assignments) is re-applied on every run;
// runtime data (inventory quantities, receipt counters) is only created, never overwritten.
const prisma = require("../src/shared/db/prisma");

// Theme: "Chai & Chill", a Bangladeshi tea café chain in Dhaka. Prices in BDT.
const OUTLETS = [
  { code: "DHA", name: "Chai & Chill Dhanmondi", location: "House 32, Road 7A, Dhanmondi, Dhaka 1209" },
  { code: "GUL", name: "Chai & Chill Gulshan", location: "Plot 12, Gulshan Avenue, Gulshan 1, Dhaka 1212" },
  { code: "UTT", name: "Chai & Chill Uttara", location: "House 5, Road 11, Sector 7, Uttara, Dhaka 1230" },
];

const MENU_ITEMS = [
  { sku: "MASALA-01", name: "Masala Chai", basePrice: "60.00", isActive: true },
  { sku: "DUDH-01", name: "Dudh Cha", basePrice: "40.00", isActive: true },
  { sku: "LEMON-01", name: "Lemon Tea", basePrice: "50.00", isActive: true },
  { sku: "MALAI-01", name: "Malai Chai", basePrice: "90.00", isActive: true },
  { sku: "COLDCOF-01", name: "Cold Coffee", basePrice: "150.00", isActive: true },
  { sku: "SINGARA-01", name: "Singara", basePrice: "20.00", isActive: true },
  { sku: "SAMOSA-01", name: "Samosa", basePrice: "25.00", isActive: true },
  { sku: "CPURI-01", name: "Chicken Puri", basePrice: "40.00", isActive: true },
  // Inactive: assigned to DHA to prove it is hidden from the outlet menu (rule 9).
  { sku: "LASSI-01", name: "Mango Lassi (seasonal)", basePrice: "120.00", isActive: false },
];

// priceOverride: null = use basePrice. isAvailable: false = unassigned (rule 10).
// Not every outlet sells everything: UTT has no Masala Chai, only GUL sells Cold Coffee (→ 404 elsewhere).
const ASSIGNMENTS = [
  { outlet: "DHA", sku: "MASALA-01", priceOverride: null, isAvailable: true, quantity: 80 },
  { outlet: "DHA", sku: "DUDH-01", priceOverride: null, isAvailable: true, quantity: 100 },
  { outlet: "DHA", sku: "LEMON-01", priceOverride: null, isAvailable: true, quantity: 40 },
  { outlet: "DHA", sku: "MALAI-01", priceOverride: null, isAvailable: true, quantity: 0 }, // out of stock
  { outlet: "DHA", sku: "SINGARA-01", priceOverride: null, isAvailable: true, quantity: 3 }, // low stock
  { outlet: "DHA", sku: "LASSI-01", priceOverride: null, isAvailable: true, quantity: 15 }, // inactive item
  { outlet: "GUL", sku: "MASALA-01", priceOverride: "80.00", isAvailable: true, quantity: 60 }, // override up
  { outlet: "GUL", sku: "MALAI-01", priceOverride: null, isAvailable: true, quantity: 25 },
  { outlet: "GUL", sku: "COLDCOF-01", priceOverride: null, isAvailable: true, quantity: 30 },
  { outlet: "GUL", sku: "SAMOSA-01", priceOverride: null, isAvailable: true, quantity: 50 },
  { outlet: "GUL", sku: "CPURI-01", priceOverride: null, isAvailable: false, quantity: 20 }, // unassigned
  { outlet: "UTT", sku: "DUDH-01", priceOverride: "35.00", isAvailable: true, quantity: 70 }, // override down
  { outlet: "UTT", sku: "LEMON-01", priceOverride: null, isAvailable: true, quantity: 30 },
  { outlet: "UTT", sku: "SINGARA-01", priceOverride: null, isAvailable: true, quantity: 100 },
  { outlet: "UTT", sku: "SAMOSA-01", priceOverride: null, isAvailable: true, quantity: 80 },
];

async function seed(tx) {
  const stats = { inventoryCreated: 0, logsCreated: 0 };

  // 1. Master menu (rule 3), upsert by unique sku.
  const itemIdBySku = {};
  for (const item of MENU_ITEMS) {
    const { sku, ...data } = item;
    const row = await tx.menuItem.upsert({
      where: { sku },
      create: item,
      update: data,
    });
    itemIdBySku[sku] = row.id;
  }

  // 2. Outlets + receipt counters (rules 1–2), upsert by unique code.
  const outletIdByCode = {};
  for (const outlet of OUTLETS) {
    const { code, ...data } = outlet;
    const row = await tx.outlet.upsert({
      where: { code },
      create: outlet,
      update: data,
    });
    outletIdByCode[code] = row.id;

    // update: {} -> never reset an existing counter (receipt numbers already issued).
    await tx.receiptCounter.upsert({
      where: { outletId: row.id },
      create: { outletId: row.id, lastNumber: 0 },
      update: {},
    });
  }

  // 3. Assignments (rules 4–6, 10) + 4. inventory and logs (rules 5, 11–16).
  for (const a of ASSIGNMENTS) {
    const outletId = outletIdByCode[a.outlet];
    const menuItemId = itemIdBySku[a.sku];
    const key = { outletId_menuItemId: { outletId, menuItemId } };

    await tx.outletMenuItem.upsert({
      where: key,
      create: { outletId, menuItemId, priceOverride: a.priceOverride, isAvailable: a.isAvailable },
      update: { priceOverride: a.priceOverride, isAvailable: a.isAvailable },
    });

    // Stock is runtime data: create once, never overwrite (would desync it from the logs).
    const existing = await tx.inventory.findUnique({ where: key });
    if (existing) continue;

    await tx.inventory.create({ data: { outletId, menuItemId, quantity: a.quantity } });
    stats.inventoryCreated++;

    if (a.quantity > 0) {
      await tx.inventoryLog.create({
        data: {
          outletId,
          menuItemId,
          changeType: "RESTOCK",
          quantityChange: a.quantity,
          balanceAfter: a.quantity,
          note: "Initial stock (seed)",
        },
      });
      stats.logsCreated++;
    }
  }

  return stats;
}

async function main() {
  const stats = await prisma.$transaction((tx) => seed(tx), { timeout: 30000 });

  const [outlets, menuItems, assignments, inventory, counters, logs] = await Promise.all([
    prisma.outlet.count(),
    prisma.menuItem.count(),
    prisma.outletMenuItem.count(),
    prisma.inventory.count(),
    prisma.receiptCounter.count(),
    prisma.inventoryLog.count({ where: { changeType: "RESTOCK" } }),
  ]);

  console.log(
    `Seed done. Created this run: ${stats.inventoryCreated} inventory rows, ${stats.logsCreated} RESTOCK logs.`
  );
  console.table({ outlets, menuItems, assignments, inventory, counters, restockLogs: logs });
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
