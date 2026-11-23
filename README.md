# F&B HQ: Multi-Outlet Menu, Inventory & Sales

A backend API (plus a small React UI) for a food & beverage company with one HQ and many outlets.
Express 5 · Prisma 6 · PostgreSQL 16 · React (Vite) · Docker.

| | |
|---|---|
| **Live UI** | https://fnb-ui.onrender.com |
| **Live API** | https://fnb-api-xm9u.onrender.com ([`/health`](https://fnb-api-xm9u.onrender.com/health)) |
| **Docs** | [Architecture](backend/docs/ARCHITECTURE.md) · [Business rules](backend/docs/BUSINESS_RULES.md) · [ERD](backend/docs/ERD.md) · [Scaling & evolution](backend/docs/SCALING_AND_EVOLUTION.md) · [Offline POS/KDS](backend/docs/OFFLINE_POS_KDS.md) · [Postman collection](backend/docs/postman_collection.json) |

## Contents
1. [Overview](#1-overview)
2. [Live demo](#2-live-demo)
3. [Quick start](#3-quick-start)
4. [Tech stack & architecture](#4-tech-stack--architecture)
5. [ERD](#5-erd)
6. [API reference](#6-api-reference)
7. [Key design decisions](#7-key-design-decisions)
8. [Authentication (not implemented)](#8-authentication-not-implemented)
9. [Scaling plan](#9-scaling-plan)
10. [Microservices evolution & Offline POS/KDS](#10-microservices-evolution--offline-poskds)
11. [Testing](#11-testing)
12. [Assumptions, limitations & next steps](#12-assumptions-limitations--next-steps)

---

## 1. Overview

| Actor | Can do |
|---|---|
| **HQ** | Manage outlets, the **master menu**, **assign** items to outlets with an optional **per-outlet price override**, manage **per-outlet inventory** (restock / absolute adjust, with a full movement log), view **reports** |
| **Outlet** | See only its own sellable menu (effective price + stock), **create sales**, view a sale's receipt |

Core rules (full list in [BUSINESS_RULES.md](backend/docs/BUSINESS_RULES.md)):
- Effective price = `priceOverride ?? basePrice`. The server always sets the price, never the client.
- An outlet sees only items that are assigned + `isAvailable` + `isActive`.
- Stock is tracked per outlet per item and **can never go negative**. Every change writes an `inventory_logs` row.
- A sale is all-or-nothing: if any item is short, the whole sale fails with `409 INSUFFICIENT_STOCK` and nothing changes.
- Receipt numbers are sequential **per outlet** (`DHA-000001`) and stay correct under concurrent sales.
- Reports: revenue + sale count per outlet, and the top 5 items per outlet, with an optional date range.
- Nothing is hard-deleted through the API. Deactivate (`isActive=false`) or unassign (`isAvailable=false`) instead.

## 2. Live demo

| | URL |
|---|---|
| UI (HQ screens + outlet POS) | https://fnb-ui.onrender.com |
| API base | https://fnb-api-xm9u.onrender.com |
| Health check | https://fnb-api-xm9u.onrender.com/health |

> **Note:** the demo runs on Render's free tier, which sleeps after inactivity. **The first request can take 30–50 seconds**
> while it wakes up. After that it responds normally.

In the UI, use the **"Demo role"** switcher (top bar) to switch between *HQ Admin* and an outlet's POS. Seed data is a tea café
chain ("Chai & Chill") with outlets **DHA**, **GUL** and **UTT**. Prices are in BDT.

## 3. Quick start

### Option A: Docker (everything in one command)

Requires Docker Desktop. From the repo root:

```bash
docker compose up --build
```

| Service | URL / port | Notes |
|---|---|---|
| `web` (UI) | http://localhost:8080 | nginx serving the Vite build |
| `api` | http://localhost:3000 (try http://localhost:3000/health) | Runs `prisma migrate deploy` → seed if DB empty → server |
| `db` | `localhost:5433` (user/pass/db `postgres`/`postgres`/`fnb`) | Postgres 16, volume `pgdata` |

No `.env` is needed because every variable has a default. To change them, copy [`.env.example`](.env.example) to `.env`.
Reset all data with `docker compose down -v`.

### Option B: Manual local setup

Requires Node 22+ and PostgreSQL 16.

**1. Database.** Use your own Postgres, or start only the compose DB, which listens on `localhost:5433`:
```bash
docker compose up -d db
```

**2. Backend**
```bash
cd backend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```
Edit `backend/.env`:

| Variable | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/fnb?schema=public` | Postgres connection |
| `PORT` | `4000` | API port (local dev default) |
| `NODE_ENV` | `development` | `development` adds `error.stack` to error responses |
| `CORS_ORIGIN` | *(unset)* | Comma-separated allow-list. Unset = any origin |

```bash
npm install
npm run prisma:generate       # Prisma client
npx prisma migrate deploy     # apply all migrations (incl. hand-written CHECK constraints)
npm run db:seed               # demo data: 3 outlets, 9 menu items, assignments, stock
npm run dev                   # API on http://localhost:4000 (nodemon)
```
For schema work, use `npm run prisma:migrate` (`prisma migrate dev`, interactive) instead of `migrate deploy`.

**3. Frontend** (optional)
```bash
cd frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:4000 for the local API
npm run dev                   # http://localhost:5173
```

## 4. Tech stack & architecture

| Layer | Choice |
|---|---|
| Runtime | Node.js 22 (CommonJS) |
| HTTP | Express 5 (native async error forwarding), helmet, cors, morgan |
| Validation | Zod 4 |
| ORM / DB | Prisma 6.19 (multi-file schema) · PostgreSQL 16 |
| Frontend | React 18 + Vite, TanStack Query, Tailwind + shadcn/ui |
| Packaging | Docker multi-stage images, docker compose (db + api + web) |

**Modular monolith.** Each business area is a module under `backend/src/modules/<name>/`, and every module is layered the same way:

```
request → route → validator (Zod) → controller → service → repository (Prisma) → PostgreSQL
            URL     body/params/query   req/res      business rules   queries only
                                        → JSON       + transactions
```

| Module | Owns (writes) | Depends on |
|---|---|---|
| `outlet` | `outlets`, `outlet_receipt_counters` | — |
| `inventory` | `inventory`, `inventory_logs` | outlet |
| `menu` | `menu_items`, `outlet_menu_items` | outlet, inventory |
| `sales` | `sales`, `sale_items` | outlet, menu, inventory |
| `reporting` | — (read-only SQL) | — |
| `events` | — (SSE stream for HQ) | shared event bus |
| `health` | — | — |

- Modules call each other **only through `modules/<x>/index.js`**. There are no dependency cycles (`outlet ← inventory ← menu ← sales`).
- Cross-module functions take an optional `tx`, so a flow across modules (a sale) is still **one** `prisma.$transaction`.
- One global `errorHandler` turns `AppError`, Zod, JSON-parse and Prisma/Postgres errors into one error format.

```
fnb-hq/
├── docker-compose.yml          db + api + web
├── .env.example                compose variables
├── backend/
│   ├── Dockerfile, docker-entrypoint.sh
│   ├── docs/                   ARCHITECTURE, BUSINESS_RULES, ERD, SCALING_AND_EVOLUTION, OFFLINE_POS_KDS, postman_collection.json
│   ├── prisma/schema/          one model per file + migrations/
│   ├── prisma/seed.js
│   ├── scripts/                concurrency-test.js, seed-if-empty.js
│   └── src/
│       ├── app.js, server.js, routes.js
│       ├── modules/            outlet/ inventory/ menu/ sales/ reporting/ events/ health/
│       │                       └── <name>.routes|validator|controller|service|repository.js + index.js
│       └── shared/             db/prisma.js, events/eventBus.js, middleware/, utils/ (AppError, money, response), validators/
└── frontend/                   React (Vite) HQ screens + outlet POS
```

Details: [ARCHITECTURE.md](backend/docs/ARCHITECTURE.md).

## 5. ERD

8 tables, 1 enum. The full diagram with columns, CHECK constraints, FK delete rules and indexes is in **[backend/docs/ERD.md](backend/docs/ERD.md)**.

```mermaid
erDiagram
    OUTLETS ||--o{ OUTLET_MENU_ITEMS : "has assigned"
    MENU_ITEMS ||--o{ OUTLET_MENU_ITEMS : "assigned to"
    OUTLET_MENU_ITEMS ||--o| INVENTORY : "stock for"
    OUTLETS ||--o| OUTLET_RECEIPT_COUNTERS : "numbers receipts"
    OUTLETS ||--o{ SALES : "makes"
    SALES ||--|{ SALE_ITEMS : "contains"
    MENU_ITEMS ||--o{ SALE_ITEMS : "sold as"
    OUTLETS ||--o{ INVENTORY_LOGS : "has"
    MENU_ITEMS ||--o{ INVENTORY_LOGS : "tracked in"
    SALES ||--o{ INVENTORY_LOGS : "causes"
```

## 6. API reference

Base URL: `http://localhost:4000` (manual setup) · `http://localhost:3000` (Docker) · `https://fnb-api-xm9u.onrender.com` (live).

### Routes (22)

| # | Method | Path | Purpose |
|---|---|---|---|
| 1 | GET | `/health` | Liveness + DB ping (`503 DB_UNAVAILABLE` if the DB is down) |
| **HQ: outlets** | | | |
| 2 | POST | `/api/hq/outlets` | Create outlet `{ name, code, location? }` (+ its receipt counter, same tx) |
| 3 | GET | `/api/hq/outlets` | List outlets |
| 4 | GET | `/api/hq/outlets/:id` | Get one outlet |
| 5 | PATCH | `/api/hq/outlets/:id` | Update `name` / `location` (`code` is immutable → 400) |
| **HQ: master menu** | | | |
| 6 | POST | `/api/hq/menu-items` | Create item `{ sku, name, basePrice, isActive? }` |
| 7 | GET | `/api/hq/menu-items?isActive=` | List items (optional active filter) |
| 8 | GET | `/api/hq/menu-items/:id` | Get one item |
| 9 | PATCH | `/api/hq/menu-items/:id` | Update `name` / `basePrice` / `isActive` |
| **HQ: assignments** | | | |
| 10 | POST | `/api/hq/outlets/:outletId/menu-items` | Assign item `{ menuItemId, priceOverride? }` + create stock row (qty 0) |
| 11 | GET | `/api/hq/outlets/:outletId/menu-items` | All assignments with `basePrice`, `priceOverride`, `effectivePrice`, `stock` |
| 12 | PATCH | `/api/hq/outlets/:outletId/menu-items/:menuItemId` | Set/clear `priceOverride`, set `isAvailable` (false = unassign) |
| **HQ: inventory** | | | |
| 13 | GET | `/api/hq/outlets/:outletId/inventory` | Stock per assigned item |
| 14 | POST | `/api/hq/outlets/:outletId/inventory/:menuItemId/restock` | Add stock `{ quantity, note? }` → RESTOCK log |
| 15 | PUT | `/api/hq/outlets/:outletId/inventory/:menuItemId` | Set absolute stock `{ quantity, note? }` → ADJUSTMENT log |
| 16 | GET | `/api/hq/outlets/:outletId/inventory/:menuItemId/logs?limit=` | Movement history, newest first (limit 1–200, default 50) |
| **HQ: reports** | | | |
| 17 | GET | `/api/hq/reports/revenue-by-outlet?from=&to=` | Revenue + sale count per outlet (`YYYY-MM-DD`, inclusive, UTC) |
| 18 | GET | `/api/hq/reports/top-items?outletId=&limit=&from=&to=` | Top N (default 5) items per outlet by quantity |
| 19 | GET | `/api/hq/events` | **Server-Sent Events** stream: `sale.created` after each committed sale ([§7](#real-time-report-updates-sse)) |
| **Outlet** | | | |
| 20 | GET | `/api/outlets/:outletId/menu` | Sellable menu: `{ menuItemId, sku, name, price, stock, inStock }` |
| 21 | POST | `/api/outlets/:outletId/sales` | Create sale `{ items: [{ menuItemId, quantity }], clientId? }` |
| 22 | GET | `/api/outlets/:outletId/sales/:saleId` | Sale with items (receipt view) |

Full status codes and edge cases for each route: [ARCHITECTURE.md → Endpoints](backend/docs/ARCHITECTURE.md#endpoints).

### Response format

```jsonc
// success
{ "success": true, "data": { ... } }
// error
{ "success": false, "error": { "code": "INSUFFICIENT_STOCK", "message": "...", "details": { ... } } }
```

| Status | Typical codes |
|---|---|
| 400 | `VALIDATION_ERROR` (Zod, `details` per body/params/query), `INVALID_JSON`, `MENU_ITEM_INACTIVE`, `ITEM_NOT_SELLABLE` |
| 404 | `OUTLET_NOT_FOUND`, `MENU_ITEM_NOT_FOUND`, `NOT_ASSIGNED`, `SALE_NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 409 | `INSUFFICIENT_STOCK`, `ALREADY_ASSIGNED`, `CLIENT_ID_CONFLICT`, `DUPLICATE`, `CONSTRAINT_VIOLATION` |
| 413 / 500 / 503 | `PAYLOAD_TOO_LARGE` / `INTERNAL_ERROR` / `DB_UNAVAILABLE` |

### Postman

[`backend/docs/postman_collection.json`](backend/docs/postman_collection.json) has 10 folders (Health → Live events), with
happy paths and error cases for every route. Import it, set the collection variable `baseUrl` (default
`http://localhost:4000`), and run folders 0–8 **in order** with the Collection Runner. Later requests use IDs saved by
earlier ones. **Deselect folder "9. Live events (SSE)" in the Runner**: the stream never ends. Send it by hand instead.

### Examples

IDs below assume a freshly seeded DB: outlet `1` = DHA, item `1` = Masala Chai (60.00), `2` = Dudh Cha (40.00),
`4` = Malai Chai (stock 0 at DHA).

**Create a sale → 201**
```bash
curl -X POST http://localhost:4000/api/outlets/1/sales \
  -H "Content-Type: application/json" \
  -d '{"clientId":"3f1c2a9e-5b7d-4c1e-9a2b-7d8e6f5a4b3c","items":[{"menuItemId":1,"quantity":2},{"menuItemId":2,"quantity":1}]}'
```
```json
{
  "success": true,
  "data": {
    "id": 1,
    "outletId": 1,
    "receiptNumber": "DHA-000001",
    "clientId": "3f1c2a9e-5b7d-4c1e-9a2b-7d8e6f5a4b3c",
    "totalAmount": "160.00",
    "createdAt": "2026-11-23T10:15:00.000Z",
    "items": [
      { "menuItemId": 1, "sku": "MASALA-01", "name": "Masala Chai", "quantity": 2, "unitPrice": "60.00", "lineTotal": "120.00" },
      { "menuItemId": 2, "sku": "DUDH-01", "name": "Dudh Cha", "quantity": 1, "unitPrice": "40.00", "lineTotal": "40.00" }
    ]
  }
}
```
Prices come from the server. The body is a strict schema, so sending `unitPrice` or `total` is a 400.

**Insufficient stock → 409** (nothing is written, and no receipt number is used up)
```bash
curl -X POST http://localhost:4000/api/outlets/1/sales \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuItemId":1,"quantity":1},{"menuItemId":4,"quantity":1}]}'
```
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Not enough stock for MALAI-01",
    "details": { "menuItemId": 4, "sku": "MALAI-01", "requested": 1, "available": 0 }
  }
}
```

**Idempotent replay → 200.** Re-sending the *same* request with the same `clientId` (e.g. a POS retry after a timeout)
returns the **original** sale with `200 OK` instead of `201`. It has the same `id` and `receiptNumber`, and stock is not
deducted again:
```json
{ "success": true, "data": { "id": 1, "receiptNumber": "DHA-000001", "clientId": "3f1c2a9e-5b7d-4c1e-9a2b-7d8e6f5a4b3c", "totalAmount": "160.00", "...": "..." } }
```
The same `clientId` sent to a **different** outlet returns `409 CLIENT_ID_CONFLICT`.

## 7. Key design decisions

| Concern | Decision | Where |
|---|---|---|
| **Money** | `DECIMAL(10,2)` for prices, `DECIMAL(12,2)` for totals. All math uses `Prisma.Decimal`, never JS floats. Returned as **strings** (`"160.00"`) | `sales.service.js`, `shared/utils/money.js` |
| **Sale = one DB transaction** | Outlet check → assignments + prices → stock deduction → receipt number → sale + items → SALE logs, all in one `prisma.$transaction` (`maxWait 5s`, `timeout 10s`). Any error rolls everything back | `sales.service.js` `createSale` |
| **No negative stock** | Atomic conditional update: `UPDATE inventory SET quantity = quantity - q WHERE … AND quantity >= q`. 0 rows changed → `409 INSUFFICIENT_STOCK` → rollback. Backed by DB `CHECK (quantity >= 0)` | `inventory.repository.js` `deduct` |
| **No deadlocks** | Fixed lock order: duplicate lines are merged, stock rows are locked in **ascending `menuItemId`**, and the receipt counter is locked **last** | `mergeLines`, ARCHITECTURE → Lock order |
| **Receipt numbers** | Per-outlet counter row `outlet_receipt_counters`, incremented inside the sale tx (row lock until commit), formatted `<CODE>-<6 digits>`. `UNIQUE (outlet_id, receipt_number)` as a safety net. A failed sale never reaches the counter, so numbers stay **gapless** | `receipt.service.js`, `outlet.service.js` |
| **Idempotency** | Optional `clientId` UUID (`UNIQUE`). Pre-check returns the existing sale (200). If two requests race, the loser hits P2002 on `client_id`, its tx rolls back (stock + number undone) and it returns the winner's sale | `sales.service.js` `replayOrConflict` |
| **Audit trail** | Every stock change writes `inventory_logs` in the same tx. `balanceAfter` is read from the DB, never computed in JS. Invariant: Σ `quantity_change` = current `quantity` | `inventory.service.js` |
| **Last line of defense** | Hand-written CHECK constraints (stock ≥ 0, prices ≥ 0, sale qty > 0, outlet code `^[A-Z]{2,10}$`), plus a composite FK so stock can exist only for assigned items | [ERD.md](backend/docs/ERD.md#check-constraints-hand-written-sql-invisible-to-prisma) |
| **Reports** | One raw SQL query each. Top-items uses `ROW_NUMBER() OVER (PARTITION BY outlet)` (no N+1) | `reporting.repository.js` |

**How we know it works under concurrency:** [`backend/scripts/concurrency-test.js`](backend/scripts/concurrency-test.js) fires
parallel requests at a running API and checks for no oversell, gapless receipts per outlet, and exactly-once creation per `clientId`.
See [§11](#11-testing).

### Real-time report updates (SSE)

HQ Reports update by themselves when any outlet makes a sale, with no reload.

```
POS ──POST /sales──▶ sales.service ──tx commits──▶ eventBus.publish("sale.created")
                                                        │
HQ browser ◀── event: sale.created ── GET /api/hq/events (SSE) ◀──┘
     └─▶ useLiveReports invalidates the report queries → TanStack Query refetches
```

| Piece | Behaviour |
|---|---|
| Event bus | In-process `EventEmitter` ([`src/shared/events/eventBus.js`](backend/src/shared/events/eventBus.js)). `publish` never throws into the caller |
| When it fires | Only **after the sale transaction commits**. Not on idempotent replays (200) and not on failed sales (4xx/5xx) |
| Payload | `event: sale.created` · `data: {"outletId":1,"receiptNo":"DHA-000007"}` |
| Stream | `GET /api/hq/events`, `text/event-stream`, `retry: 5000`, a `: heartbeat` comment every 25 s (keeps proxies from closing it), listener removed when the client disconnects, all streams closed on graceful shutdown |
| Frontend | `useLiveReports` (mounted once in `HqLayout`) opens an `EventSource`. On `sale.created`, and after a reconnect, it invalidates the revenue and top-items queries |
| Fallback | Report queries also refetch on window focus and every 60 s while Reports is open. The ⟳ button still works |

Try it:
```bash
curl -N http://localhost:4000/api/hq/events      # terminal 1: prints ": connected", then events
# terminal 2: create a sale (see Examples above). Terminal 1 prints:
# event: sale.created
# data: {"outletId":1,"receiptNo":"DHA-000001"}
```

## 8. Authentication (not implemented)

**Why it's out of scope:** the brief did not require authentication. The outlet is identified by `:outletId` in the URL. I
spent the time on correctness (transactions, concurrency, idempotency) instead.

**Plan.** The route split already prepares for it:

| Piece | Design |
|---|---|
| Identity | `users` table (`email`, `password_hash` with argon2/bcrypt, `role`, `outlet_id` nullable). `POST /api/auth/login` → short-lived **JWT** access token (+ refresh token) |
| Roles | `HQ_ADMIN`: everything under `/api/hq/*`. `OUTLET`: only `/api/outlets/:outletId/*` for **its own** outlet (claim `outletId` in the token) |
| Middleware | `authenticate` (verify JWT → `req.user`) on `/api`. `requireRole("HQ_ADMIN")` mounted once on the `/hq` router. `requireOutletAccess` on `/outlets/:outletId` that checks `req.user.role === "HQ_ADMIN" \|\| req.user.outletId === :outletId`, else `403 FORBIDDEN` |
| Where | `src/routes.js` already mounts `api.use("/hq", hq)` and the outlet routers separately, so each guard is added in **one place** and no route handler changes |
| Later | POS device tokens (per terminal), audit `created_by` on sales and stock changes, rate limiting on login |

## 9. Scaling plan

Target: 10 outlets, ~100k sales/month (≈ 5–10 sales/s at peak). One well-indexed Postgres handles this. The plan focuses on
reporting load and operations. Full plan: **[SCALING_AND_EVOLUTION.md](backend/docs/SCALING_AND_EVOLUTION.md)**.

- **Connection pooling**: Prisma pool sizing, PgBouncer in front of Postgres when running many API instances.
- **Read replicas**: reports and HQ lists read from a replica. Sales and stock stay on the primary.
- **Caching**: outlet menus (invalidated on assignment/price change) and report responses (short TTL). Stock for the sale
  decision is never cached.
- **Partitioning**: monthly range partitions for `sales`, `sale_items`, `inventory_logs`, plus archiving/retention.
- **Queue for reports**: a transactional outbox → queue → daily summary table. Heavy exports run as async jobs.
- **Infra**: stateless API containers behind a load balancer, managed Postgres with PITR, CI/CD with `migrate deploy`, metrics and alerts.
- **Live updates across instances**: today's event bus is **in-process**. With several API instances, a sale handled by
  instance A would not reach HQ browsers connected to instance B. The fix is to publish `sale.created` to **Redis pub/sub**.
  Every instance subscribes and forwards to its own SSE clients. Postgres `LISTEN/NOTIFY`, or the outbox → broker, works
  too. Only `eventBus.publish`/`subscribe` change, not the endpoint or the frontend. The load balancer must allow
  long-lived connections; the 25 s heartbeat keeps them from being closed as idle.

## 10. Microservices evolution & Offline POS/KDS

**Microservices** ([SCALING_AND_EVOLUTION.md §6–7](backend/docs/SCALING_AND_EVOLUTION.md#6-architectural-evolution)): today's
modules map to **Catalog** (outlet + menu), **Outlet Ops** (sales + inventory + receipt counter, kept **together** because a
sale needs them in one ACID transaction; splitting them would need a reservation saga) and **Reporting** (event-built read
model). Services talk sync REST for queries and use events through an outbox for state changes.

**Offline POS & KDS** ([OFFLINE_POS_KDS.md](backend/docs/OFFLINE_POS_KDS.md)):
- POS keeps the menu and a sale **outbox in IndexedDB**. Each sale gets a client UUID at checkout.
- A sync loop replays the outbox FIFO with backoff. `clientId` makes it safe (201 new / **200 replay**), and that part is
  **already implemented** server-side.
- Conflicts (stock short, price changed, item unassigned while offline) are accepted and flagged for review rather than
  rejected, because the sale already happened. Offline receipts use per-terminal provisional numbers.
- POS ↔ KDS goes over the **outlet LAN** through a local WebSocket hub with persisted events, acks and replay, so the kitchen
  doesn't depend on the internet.

## 11. Testing

### Concurrency test

Needs a **running API**. It creates its own fixtures (1 item + 3 outlets named `CT …`), so seeded data is not touched.

```bash
cd backend
npm run dev                    # terminal 1 (API on :4000)
npm run test:concurrency       # terminal 2
```
Against another instance, e.g. Docker on :3000:
```bash
API_URL=http://localhost:3000 npm run test:concurrency                  # bash
$env:API_URL="http://localhost:3000"; npm run test:concurrency         # PowerShell
```

| Test | Scenario | Proves |
|---|---|---|
| 1 | Stock = 5, **20 parallel** sales of qty 1 at one outlet | Exactly 5 × 201 and 15 × 409, stock ends at 0 (never negative), Σ logs = stock, receipts gapless `000001–000005` |
| 2 | **30 parallel** sales across 2 outlets | All succeed, receipts unique + gapless **per outlet**, prefix = outlet code |
| 3 | Same `clientId` sent **5× in parallel** | Exactly 1 sale (one 201 + four 200), stock deducted once, no receipt number burned |

Expected output on a freshly seeded DB (IDs vary with existing data, outlet codes are random per run):
```
API: http://localhost:4000/api

Fixtures: item 10 (CT-MID3K2Q); outlets A=4 QWERTYUI, B=5 ASDFGHJK, C=6 ZXCVBNML

Test 1: stock = 5, 20 parallel sales of qty 1 (outlet A)
PASS  exactly 5 sales succeed (201)  — got 5
PASS  exactly 15 get 409 INSUFFICIENT_STOCK  — got 15
PASS  no other status codes  — [201,409]
PASS  stock = 0, never negative  — stock 0
PASS  Σ log changes = stock
PASS  receipts gapless 000001..000005 (failed sales used no numbers)  — QWERTYUI-000001 QWERTYUI-000002 QWERTYUI-000003 QWERTYUI-000004 QWERTYUI-000005

Test 2: 30 parallel sales across outlets B and C
PASS  all 30 succeed  — [201]
PASS  receipts unique + gapless for B (ASDFGHJK)
PASS  receipts unique + gapless for C (ZXCVBNML)
PASS  receipt prefix = outlet code

Test 3: same clientId sent 5x in parallel (outlet B)
PASS  exactly 1 sale created  — distinct sale ids: 36
PASS  one 201 + four 200 (replays)  — [201,200,200,200,200]
PASS  stock deducted once  — 985 → 984
PASS  B receipts still gapless (losers used no number)  — ASDFGHJK-000016
PASS  Σ log changes = stock for B

ALL PASS
```
The exit code is `0` on success and `1` on any failure. Fixtures stay in the DB because there is no DELETE API by design.

### Functional tests
Run the [Postman collection](backend/docs/postman_collection.json) in order (§6). It covers every route, including
validation, 404/409 paths and global errors.

## 12. Assumptions, limitations & next steps

**Assumptions**
- One company, many outlets, one currency (seed uses BDT). Money has 2 decimals.
- Report dates are `YYYY-MM-DD`, inclusive, interpreted in **UTC**.
- An outlet's `code` is immutable once created (it is printed on receipts).
- Inactive or unassigned items still count in reports (historical sales).
- HQ is the single source of truth for menu, prices and assignments.

**Limitations**
- **No authentication/authorization** (see §8). Anyone who knows an `outletId` can sell for it.
- No DELETE endpoints (by design). Mistakes are fixed by deactivating, unassigning or adjusting.
- Automated tests are the concurrency script + the Postman collection. There is no unit/integration test suite (Jest) yet.
- The concurrency test leaves its fixtures in the DB.
- Offline POS, KDS, caching, replicas and partitioning are designed ([docs](backend/docs/SCALING_AND_EVOLUTION.md)) but not built.
- Live demo: free tier with cold starts (§2).

**With more time**
1. JWT auth + roles + `requireOutletAccess` middleware (§8).
2. Jest + Supertest integration tests against a throwaway Postgres (Testcontainers), and running the concurrency test in CI.
3. CI pipeline (lint, tests, image build, `migrate deploy`) and an OpenAPI spec generated from the Zod schemas.
4. Transactional outbox + daily summary table for reports. Cache for outlet menus.
5. Offline sync endpoint with the tolerant conflict rules from [OFFLINE_POS_KDS.md](backend/docs/OFFLINE_POS_KDS.md).
6. Sales void/refund flow (with a compensating stock log), pagination on list endpoints, structured logging + metrics.
