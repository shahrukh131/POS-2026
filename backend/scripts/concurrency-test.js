// Concurrency test for the sales transaction (rules 20, 25–28).
// Talks to a RUNNING API (npm run dev) with plain fetch. No extra libraries.
// Creates its own fixtures (1 item + 3 outlets "CT …") so seeded data is never touched.
// These fixtures stay in the DB: there is no DELETE API by design.
//
//   npm run test:concurrency            (uses PORT from .env, default 4000)
//   API_URL=http://localhost:4100 npm run test:concurrency

require("dotenv").config({ quiet: true });
const { randomUUID } = require("crypto");

const ROOT = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
const BASE = ROOT + "/api";
let failures = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function must(method, path, body, expected) {
  const r = await call(method, path, body);
  if (r.status !== expected) {
    throw new Error(`${method} ${path} → ${r.status} (expected ${expected}): ${JSON.stringify(r.json)}`);
  }
  return r.json.data;
}

function check(name, ok, detail = "") {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const randomCode = () => Array.from({ length: 8 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]).join("");
const count = (arr, v) => arr.filter((x) => x === v).length;
const receiptNo = (r) => Number(r.split("-").pop());
const isGapless = (receipts) => {
  const nums = receipts.map(receiptNo).sort((a, b) => a - b);
  return nums.every((n, i) => n === i + 1) && new Set(receipts).size === receipts.length;
};

async function stockOf(outletId, menuItemId) {
  const rows = await must("GET", `/hq/outlets/${outletId}/inventory`, null, 200);
  return rows.find((r) => r.menuItemId === menuItemId).quantity;
}

async function logSum(outletId, menuItemId) {
  const logs = await must("GET", `/hq/outlets/${outletId}/inventory/${menuItemId}/logs?limit=200`, null, 200);
  return logs.reduce((s, l) => s + l.quantityChange, 0);
}

async function main() {
  console.log(`API: ${BASE}\n`);
  const health = await fetch(ROOT + "/health").catch(() => null);
  if (!health || !health.ok) throw new Error(`API not reachable/healthy at ${ROOT}. Start it with: npm run dev`);

  // ---- fixtures ----
  const run = Date.now().toString(36).toUpperCase();
  const item = await must("POST", "/hq/menu-items", { sku: `CT-${run}`, name: `CT Tea ${run}`, basePrice: 10 }, 201);
  const outlets = [];
  for (const label of ["A", "B", "C"]) {
    const o = await must("POST", "/hq/outlets", { name: `CT Outlet ${label} ${run}`, code: randomCode() }, 201);
    await must("POST", `/hq/outlets/${o.id}/menu-items`, { menuItemId: item.id }, 201);
    outlets.push(o);
  }
  const [A, B, C] = outlets;
  console.log(`Fixtures: item ${item.id} (${item.sku}); outlets A=${A.id} ${A.code}, B=${B.id} ${B.code}, C=${C.id} ${C.code}\n`);

  const sell = (outletId, extra = {}) =>
    call("POST", `/outlets/${outletId}/sales`, { items: [{ menuItemId: item.id, quantity: 1 }], ...extra });

  // ---- Test 1: stock 5, 20 parallel sales of qty 1 ----
  console.log("Test 1: stock = 5, 20 parallel sales of qty 1 (outlet A)");
  await must("PUT", `/hq/outlets/${A.id}/inventory/${item.id}`, { quantity: 5, note: "concurrency test" }, 200);
  const t1 = await Promise.all(Array.from({ length: 20 }, () => sell(A.id)));
  const s1 = t1.map((r) => r.status);
  const short = t1.filter((r) => r.json?.error?.code === "INSUFFICIENT_STOCK").length;
  const stockA = await stockOf(A.id, item.id);
  const receiptsA = t1.filter((r) => r.status === 201).map((r) => r.json.data.receiptNumber);
  check("exactly 5 sales succeed (201)", count(s1, 201) === 5, `got ${count(s1, 201)}`);
  check("exactly 15 get 409 INSUFFICIENT_STOCK", count(s1, 409) === 15 && short === 15, `got ${count(s1, 409)}`);
  check("no other status codes", count(s1, 201) + count(s1, 409) === 20, JSON.stringify([...new Set(s1)]));
  check("stock = 0, never negative", stockA === 0, `stock ${stockA}`);
  check("Σ log changes = stock", (await logSum(A.id, item.id)) === stockA);
  check("receipts gapless 000001..000005 (failed sales used no numbers)", isGapless(receiptsA) && receiptsA.length === 5, receiptsA.sort().join(" "));

  // ---- Test 2: 30 parallel sales across 2 outlets ----
  console.log("\nTest 2: 30 parallel sales across outlets B and C");
  for (const o of [B, C]) await must("POST", `/hq/outlets/${o.id}/inventory/${item.id}/restock`, { quantity: 1000 }, 200);
  const t2 = await Promise.all(Array.from({ length: 30 }, (_, i) => sell(i % 2 ? C.id : B.id)));
  const receiptsB = t2.filter((r) => r.status === 201 && r.json.data.outletId === B.id).map((r) => r.json.data.receiptNumber);
  const receiptsC = t2.filter((r) => r.status === 201 && r.json.data.outletId === C.id).map((r) => r.json.data.receiptNumber);
  check("all 30 succeed", count(t2.map((r) => r.status), 201) === 30, JSON.stringify([...new Set(t2.map((r) => r.status))]));
  check(`receipts unique + gapless for B (${B.code})`, receiptsB.length === 15 && isGapless(receiptsB));
  check(`receipts unique + gapless for C (${C.code})`, receiptsC.length === 15 && isGapless(receiptsC));
  check("receipt prefix = outlet code", receiptsB.every((r) => r.startsWith(B.code + "-")) && receiptsC.every((r) => r.startsWith(C.code + "-")));

  // ---- Test 3: same clientId 5x in parallel ----
  console.log("\nTest 3: same clientId sent 5x in parallel (outlet B)");
  const clientId = randomUUID();
  const stockBefore = await stockOf(B.id, item.id);
  const t3 = await Promise.all(Array.from({ length: 5 }, () => sell(B.id, { clientId })));
  const saleIds = new Set(t3.filter((r) => r.json?.success).map((r) => r.json.data.id));
  const s3 = t3.map((r) => r.status);
  const stockAfter = await stockOf(B.id, item.id);
  check("exactly 1 sale created", saleIds.size === 1, `distinct sale ids: ${[...saleIds].join(",")}`);
  check("one 201 + four 200 (replays)", count(s3, 201) === 1 && count(s3, 200) === 4, JSON.stringify(s3));
  check("stock deducted once", stockBefore - stockAfter === 1, `${stockBefore} → ${stockAfter}`);
  const receiptB3 = t3.find((r) => r.status === 201)?.json.data.receiptNumber;
  check("B receipts still gapless (losers used no number)", isGapless([...receiptsB, receiptB3]), receiptB3);
  check("Σ log changes = stock for B", (await logSum(B.id, item.id)) === stockAfter);

  console.log(`\n${failures === 0 ? "ALL PASS" : `${failures} FAILED`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exitCode = 1;
});
