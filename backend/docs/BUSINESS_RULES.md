# Business Rules

## Scope
One company → many outlets. HQ manages the master menu and assigns items to outlets.
Outlets create sales and deduct their own stock. HQ sees reports.
No authentication. The outlet is identified by `:outletId` in the URL.

## Actors
- **HQ**: manages outlets, the master menu, assignments, price overrides and inventory, and views reports.
- **Outlet**: views its own assigned menu and creates sales.

## 0. Outlets
1. HQ creates outlets: unique `name`, unique `code` (2–10 uppercase letters, e.g. `DHA`; DB CHECK), optional `location`.
   `name` and `location` can be edited later. `code` is **immutable** (400 if sent), because it is printed on existing receipts.
2. The outlet's ReceiptCounter row (`lastNumber = 0`) is created in the **same transaction** as the outlet.

## 1. Master menu & assignment
3. HQ creates master menu items (unique `sku`, `name`, `basePrice ≥ 0`).
4. HQ assigns a menu item to a specific outlet. The same item can't be assigned twice to one outlet (409).
   An inactive item can't be assigned (400). An unavailable assignment is re-enabled with `PATCH isAvailable=true`; POST stays 409.
5. Assigning also creates that outlet's Inventory row with `quantity = 0`, in the same transaction.
6. HQ can override the price per outlet (`priceOverride ≥ 0`, optional). Setting it to `null` clears the override.
7. Effective price = `priceOverride ?? basePrice`.
8. An outlet retrieves **only** the items assigned to it, with its effective price.
9. Items with `isActive = false` or `isAvailable = false` are hidden from the outlet menu and can't be sold.
10. Nothing is hard-deleted through the API:
    - Master item: deactivate with `isActive = false`.
    - Unassign from an outlet: set `isAvailable = false`. There is **no delete endpoint** for assignments, because deleting would cascade to the inventory row.

## 2. Inventory
11. Stock is tracked per outlet per menu item.
12. Stock can exist only for items assigned to that outlet (enforced by a composite FK).
13. Stock can never be negative (checked in the app and by a DB CHECK constraint).
14. **Restock**: HQ adds `quantity > 0`. Logged as RESTOCK with `quantityChange = +quantity`.
15. **Adjust**: HQ sets an absolute `quantity ≥ 0` (stock count, waste). Logged as ADJUSTMENT with `quantityChange = new − old` and an optional `note`.
16. Every stock change writes an InventoryLog row (`quantityChange`, `balanceAfter`) in the same transaction.

## 3. Sales transaction
17. A sale belongs to one outlet and has 1 or more items, each with an integer quantity > 0.
18. Duplicate items in one request are merged.
19. Item checks:
    - Unknown outlet → **404**.
    - Item not assigned to that outlet → **404**.
    - Item inactive or unavailable → **400**.
20. Stock is deducted atomically per item. If any item is short, the **whole sale fails (409 INSUFFICIENT_STOCK)** and nothing changes.
21. The unit price is taken from the server (effective price) and copied into SaleItem. It is never trusted from the client.
22. Total = Σ(unitPrice × quantity), calculated on the server.
23. Each deduction writes an InventoryLog row (SALE, with `saleId`).
24. Everything runs in **one database transaction**.
25. Optional `clientId` (UUID) is an idempotency key for offline POS sync. It is UNIQUE. Re-sending the same `clientId` returns the existing sale (200) instead of creating a second one. A `clientId` already used by **another** outlet → 409 `CLIENT_ID_CONFLICT`.

## 4. Receipt number
26. Sequential and unique **per outlet**: `<OUTLET_CODE>-<6 digits>`, e.g. `DHA-000001`.
27. It stays correct under concurrent requests: the per-outlet counter is incremented atomically inside the transaction (row lock), and `(outletId, receiptNumber)` is UNIQUE in the DB.
28. A failed sale rolls back, so its number is not used up.

## 5. Reporting (HQ)
29. Total revenue by outlet. Outlets with no sales are included with revenue `0.00`.
30. Optional `from`/`to` filter: ISO dates (`YYYY-MM-DD`), inclusive, interpreted in UTC. `from > to` → 400.
31. Top 5 selling items per outlet, by total quantity sold (revenue also shown). Ties are broken by revenue (desc), then item name (asc). The same date filter applies.