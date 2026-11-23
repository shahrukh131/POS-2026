# Scaling & Evolution

How the current modular monolith grows: first one database, then a split into services. Nothing in this document is implemented
unless it says so. "Today" means the code in this repo.

Related: [ARCHITECTURE.md](ARCHITECTURE.md) · [OFFLINE_POS_KDS.md](OFFLINE_POS_KDS.md) · [ERD.md](ERD.md)

---

## 1. Scale target and what it means

| Metric | Value |
|---|---|
| Outlets | 10 (growing) |
| Sales / month | ~100,000 ≈ 3,300 / day |
| Peak (lunch/dinner) | roughly 5–10 sales/s across all outlets |
| Rows / year | ~1.2 M `sales`, ~3–4 M `sale_items`, ~3–4 M `inventory_logs` |

A single well-indexed PostgreSQL instance handles this easily. A sale is one short transaction: a few row locks and roughly 10
statements. So the real work is in **reporting load, reliability and operations**, not raw write throughput. The steps below
are ordered by when they become worth doing.

## 2. Database

### 2.1 Connection pooling (first step)
- Size Prisma's pool explicitly (`?connection_limit=` in `DATABASE_URL`) for each API instance.
- With more than one API instance, put **PgBouncer** (transaction mode) or the managed provider's pooler in front of Postgres, so
  `instances × pool size` stays under `max_connections`.
- The sale transaction already uses `{ maxWait: 5000, timeout: 10000 }`, so a short wait for a pooled connection or row lock
  doesn't fail a sale.

### 2.2 Read replicas
- Writes (sales, stock, HQ edits) stay on the **primary**.
- HQ reports (`reporting` module, raw read-only SQL) and the HQ list screens move to a **read replica**. Reporting already owns
  no tables and only reads, so it only needs a second Prisma client pointed at the replica URL.
- The outlet menu (`GET /api/outlets/:id/menu`) stays on the primary, or on the replica with a lag guard, because the POS needs
  fresh stock.

### 2.3 Partitioning
- Partition `sales`, `sale_items` and `inventory_logs` **by month** on `created_at` (declarative range partitioning). The
  report's `WHERE created_at BETWEEN …` then prunes to a few partitions.
- `sale_items` has no `created_at` today. Add one, denormalised from the sale, before partitioning, so it can share the key.
- Unique keys must include the partition key: `(outlet_id, receipt_number)` becomes `(outlet_id, receipt_number, created_at)`,
  or receipt uniqueness is enforced by the counter alone, which already guarantees it.
- Retention: detach partitions older than N years to cold storage or archive. Logs can be kept for a shorter time than sales.

### 2.4 Index hygiene
- Review the report queries with `EXPLAIN ANALYZE` against production-sized data.
- Today's indexes are listed in [ERD.md](ERD.md#unique-keys--indexes). `sales (outlet_id, created_at)` already serves the
  revenue report.

## 3. Caching

| What | Where | TTL / invalidation |
|---|---|---|
| Outlet menu (`/api/outlets/:id/menu`) without stock | Redis or in-process LRU, key `menu:{outletId}` | Invalidate on assignment / price / `isActive` / `isAvailable` change. Stock is joined in fresh, or served with a short (~5 s) TTL |
| HQ reports | Redis, key = route + query string | 30–60 s TTL. Today's numbers may lag slightly; past days are immutable and can be cached longer |
| Master menu list | HTTP `ETag` / `Cache-Control` | Changes rarely |

Never cache stock for the **sale decision**. The sale always checks stock atomically in the DB (`UPDATE … WHERE quantity >= q`).

## 4. Reporting at scale: queue + summary tables

Today the reports aggregate raw `sales` / `sale_items` in one query. That is fine for months of data, but it gets slower as
history grows.

1. **Daily summary table** `daily_outlet_item_sales (day, outlet_id, menu_item_id, qty, revenue)`. Reports read summaries for
   past days plus raw rows for "today".
2. Fill it **asynchronously**: the sale transaction also writes an **outbox** row (`sale_created`) in the same transaction. A
   worker reads the outbox and puts events on a queue (BullMQ/Redis, SQS or RabbitMQ). A consumer upserts the summary.
   Because the outbox row commits with the sale, no events are lost.
3. Heavy, ad-hoc exports (CSV, month-end) become **queued jobs**: `POST /reports/jobs` → `202 { jobId }` → poll or webhook.
   This keeps long queries off the request path.
4. Later: CDC from the replica (Debezium) into a warehouse (BigQuery / ClickHouse) for BI.

## 5. Infrastructure

- **Stateless API**: no session state, config comes only from env. Run N containers behind a load balancer and scale
  horizontally. Today's `Dockerfile` and `/health` (DB ping) already fit this.
- **Managed Postgres** with automated backups and point-in-time recovery.
- **CI/CD**: lint + tests → build image → `prisma migrate deploy` (one job, before rollout) → rolling deploy.
  `docker-entrypoint.sh` already runs `migrate deploy` at start. With many replicas, move this into a single release step.
- **Observability**: structured JSON logs (replace `morgan`), request IDs, metrics (p95 latency, 409 `INSUFFICIENT_STOCK`
  rate, transaction wait time), alerts on 5xx and DB saturation.
- **Secrets** come from the platform's secret store, never from files.
- **Live updates (SSE) across instances**: `GET /api/hq/events` is fed by an in-process `EventEmitter`
  (`src/shared/events/eventBus.js`). With N instances, a sale on instance A would not reach HQ browsers connected to
  instance B. Fix: `eventBus.publish` sends to **Redis pub/sub** (channel `sale.created`). Every instance subscribes once and
  forwards to its own SSE clients. Alternatives are Postgres `LISTEN/NOTIFY` (no new infra) or the outbox → broker from §4.
  The endpoint and frontend stay the same. The load balancer must allow long-lived HTTP connections (no response buffering,
  idle timeout > the 25 s heartbeat).

## 6. Architectural evolution

| Stage | Shape | Trigger |
|---|---|---|
| 1 (today) | Modular monolith: `outlet ← inventory ← menu ← sales`, `reporting` on top. Cross-module calls only via `index.js`, and every API function takes `tx` | — |
| 2 | Same monolith + **transactional outbox** + workers (reports, notifications, KDS fan-out) | Async side effects needed |
| 3 | Extract services where team size or load justifies it (§7) | Separate teams, different scaling or release cadence |

The module boundaries were chosen so stage 3 is mostly moving code. The places where modules still read each other's tables
are listed as "split points" in [ARCHITECTURE.md](ARCHITECTURE.md#modules-modular-monolith).

## 7. Conversion to microservices

| Service | Owns | Today's module(s) | Notes |
|---|---|---|---|
| **Catalog** | outlets, master menu, assignments, price overrides | `outlet`, `menu` | Read-heavy and cacheable. Publishes `MenuChanged`, `PriceChanged` |
| **Outlet Ops** (Sales + Inventory) | sales, sale_items, receipt counters, inventory, inventory_logs | `sales`, `inventory` (+ receipt counter from `outlet`) | Write-critical, strict consistency, must be highly available |
| **Reporting** | its own read model (summaries) | `reporting` | Built from `SaleCreated` events. Read-only API |
| (later) **Identity** | users, roles, outlet access | — | JWT issuer (see README → Auth) |

### Why Sales and Inventory stay together
A sale must **deduct stock, take a receipt number and record the sale atomically**. Today this is one ACID transaction with a
fixed lock order (stock rows by ascending `menuItemId`, then the receipt counter, then inserts).

Split across two services, the same guarantee needs a **saga**:
`reserve stock → create sale → confirm reservation` (or `release` as compensation). That adds reservation timeouts, compensation
logic, and a window where stock is "reserved but not sold". It buys nothing at ~10 sales/s.
So the plan keeps **sales + inventory + receipt counter in one service** (one DB, same transaction) and splits around it.
If they ever must be split, use the reservation saga, with `clientId` as the saga's idempotency key.

### Communication
- **Sync REST** for queries. Sales reads assignments and effective prices from Catalog, through a local cache that Catalog
  events keep warm, so a Catalog outage doesn't stop sales.
- **Events** for state changes (`SaleCreated`, `StockChanged`, `MenuChanged`) through a broker. Each service publishes through
  its own **outbox** (at-least-once). Consumers are idempotent by event ID.
- Each service owns its own database schema. Today's raw cross-module joins (the split points) become API calls or local
  read models.

## 8. Offline POS and KDS

The design is in its own document: **[OFFLINE_POS_KDS.md](OFFLINE_POS_KDS.md)**. It covers the local queue in IndexedDB, sync with
`clientId` idempotency, conflict handling, offline receipt numbers, and POS ↔ KDS over the outlet LAN.
