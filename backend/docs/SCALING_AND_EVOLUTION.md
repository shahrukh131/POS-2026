# Scaling & Evolution

> Outline. To be written in full near the end of the assessment.

## 1. Scale target
- 10 outlets, 100,000 transactions/month ≈ 3,300/day. Peak is roughly 5–10 sales/s at lunch and dinner.
- Conclusion to argue: a single well-indexed Postgres handles this easily. The work is in reporting, reliability and operations, not raw throughput.

## 2. Database scaling
- Connection pooling (PgBouncer / Prisma pool sizing).
- Read replica for reports. Writes (sales) stay on the primary.
- Monthly partitioning of `sales`, `sale_items`, `inventory_logs`.
- Archive old partitions. Retention policy for logs.
- Index review with `EXPLAIN ANALYZE` on report queries.

## 3. Reporting performance
- Daily summary table (`daily_outlet_item_sales`) or a materialized view, refreshed on a schedule or by events.
- Reports read summaries instead of raw `sale_items`.
- Cache report responses (short TTL). Cache outlet menus (invalidate on assignment or price change).
- Later: move analytics to a warehouse (ELT from replica / CDC).

## 4. Infrastructure
- Stateless API containers behind a load balancer; horizontal scaling.
- Managed Postgres with automated backups and PITR.
- CI/CD: build image → run migrations (`prisma migrate deploy`) → deploy.
- Monitoring: health checks, structured logs, metrics (latency, 409 rate), alerts.
- Secrets from the platform, not files.

## 5. Architectural evolution
- Stage 1: modular monolith (current). Clear module boundaries per domain.
- Stage 2: async side effects via a transactional outbox (e.g. report updates).
- Stage 3: extract services when team size or load justifies it (see §6).

## 6. Conversion to microservices
- **Catalog/Menu service**: master menu, assignments, prices. Read-heavy and cacheable.
- **Inventory service**: stock, restock, adjustments, logs. Strict consistency.
- **Sales/POS service**: sales, receipts. Write-critical and must be highly available.
- **Reporting service**: built from sale events. Has its own read model.
- Communication: sync REST for queries, events (broker) for state changes. Outbox pattern for reliable publishing.
- Hard part: a sale touches stock + receipt. Options are a saga / reservation, or keeping Sales + Inventory together. Explain the choice and why.

## 7. Offline POS mode
- POS keeps a local DB (SQLite / IndexedDB) with a cached menu, prices and an estimate of stock.
- Each offline sale gets a client-generated UUID → `sales.client_id` (UNIQUE, already in the schema) → sync is idempotent.
- Offline receipt numbers per terminal (e.g. `DHA-T1-000123`), or a block of numbers reserved while online.
- Sync queue: FIFO, retry with backoff, ack per sale. The server returns the existing sale for duplicates.
- HQ is the source of truth for menu and prices. Stock conflicts on sync: accept the sale, allow a negative-stock flag/alert for review (explain the trade-off against the online rule).

## 8. POS ↔ KDS during offline mode
- Communicate over the outlet LAN, with no dependency on the internet.
- Local hub (on the POS or a small edge box): WebSocket / MQTT broker, discovered via mDNS or a static IP.
- Order events are persisted locally and acknowledged by the KDS. They replay after a KDS restart.
- When the internet returns, the hub syncs both sales and kitchen events to HQ.
