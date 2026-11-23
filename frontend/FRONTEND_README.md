# F&B HQ — Frontend

Vite + React 18 + React Router 6, Tailwind CSS v4 + shadcn/ui, TanStack Query v5, react-hook-form + zod. No auth: a **"Demo role"** switcher in the top bar switches between **HQ Admin** and any **Outlet** (saved in `localStorage`).

## Setup

```bash
cd frontend
npm install
copy .env.example .env      # Windows CMD  (mac/linux: cp .env.example .env)
npm run dev                 # http://localhost:5173
npm run build               # production build -> dist/
```

`.env`:
```
VITE_API_URL=http://localhost:3000
```
The backend must allow CORS from `http://localhost:5173` (e.g. `app.use(cors())`).

## Screens

| View as | Screen | What it does |
|---|---|---|
| HQ | Outlets | List, add and edit outlets (code is fixed after creation: it is printed on receipts) |
| HQ | Menu Items | List, add/edit, activate/deactivate |
| HQ | Assignments | Pick outlet → assign items, price override, availability |
| HQ | Inventory | Pick outlet → stock table, Restock (+qty) and Adjust (+/- with reason) |
| HQ | Reports | Date range → revenue by outlet + top 5 items per outlet |
| Outlet | POS | Menu tiles with price + stock, out-of-stock disabled, cart, checkout → receipt no. (e.g. `DHA-000001`) |

POS checkout sends a `clientId` UUID for idempotency. The same `clientId` is reused if a request fails (network/5xx) so a retry can't create a double sale; a new one is generated after success or a 409. On **409** (insufficient stock) it shows a clear toast and reloads the menu stock.

## API endpoints assumed

**Each feature's calls live in `src/features/<feature>/api/*Api.js`**, all going through `src/lib/api/httpClient.js`. Lines marked `// ASSUMED` are guesses — change the path/body there if your Express routes differ. Components never call `fetch` directly. Responses may be raw or wrapped in `{ data: ... }`; field names are mapped by the `map*FromApi` functions (`features/*/api/*Mappers.js`, and `lib/api/responseMappers.js` for outlet-menu rows shared by assignments, inventory and POS).

| Method | Path | Body | Status |
|---|---|---|---|
| GET | `/api/hq/outlets` | | known |
| POST | `/api/hq/outlets` | `{ code (2-10 letters), name, location? }` | known |
| PATCH | `/api/hq/outlets/:id` | `{ name?, location? }`; `location: null` clears it, code cannot change | known |
| GET | `/api/hq/menu-items` | | assumed |
| POST | `/api/hq/menu-items` | `{ name, sku?, category?, basePrice, isActive }` | assumed |
| PATCH | `/api/hq/menu-items/:id` | any of the above (toggle sends `{ isActive }`) | assumed |
| GET | `/api/hq/outlets/:outletId/menu-items` | | assumed |
| POST | `/api/hq/outlets/:outletId/menu-items` | `{ menuItemId, priceOverride \| null, isAvailable }` | assumed |
| PATCH | `/api/hq/outlets/:outletId/menu-items/:menuItemId` | `{ priceOverride \| null, isAvailable }` | assumed |
| GET | `/api/hq/outlets/:outletId/inventory` | | assumed |
| POST | `/api/hq/outlets/:outletId/inventory/:menuItemId/restock` | `{ quantity, note? }` | assumed |
| POST | `/api/hq/outlets/:outletId/inventory/:menuItemId/adjust` | `{ delta, reason }` | assumed |
| GET | `/api/hq/reports/revenue-by-outlet?from=&to=` | → `[{ outletId, code, name, totalRevenue, saleCount }]` | known |
| GET | `/api/hq/reports/top-items?from=&to=&limit=5` | → `[{ outletId, code, items:[{ menuItemId, name, qtySold, revenue }] }]` | known |
| GET | `/api/outlets/:outletId/menu` | → items with `menuItemId, name, price/effectivePrice, stock/quantity, isAvailable` | known |
| POST | `/api/outlets/:outletId/sales` | `{ clientId, items:[{ menuItemId, quantity }] }` → `{ receiptNumber, totalAmount, ... }` | known |

Money is expected as strings (`"1250.00"`) and shown as `৳ 1,250.00`.

## Structure

Feature-based: everything for one business area lives in one folder.

```
src/
  main.jsx                    # createRoot → <AppProviders><AppRouter/></AppProviders>
  app/
    providers/AppProviders.jsx   # QueryClient, Router, ViewAs, Toaster, React Query Devtools (dev only)
    router/AppRouter.jsx         # HQ vs outlet route trees, lazy-loaded pages
    router/routePaths.js         # ROUTE_PATHS constants — never hard-code a path
    layouts/                     # HqLayout (header + sidebar), PosLayout (header), AppHeader, ViewAsSelect
  components/
    ui/                          # shadcn/ui generated components — add more with `npx shadcn@latest add <name>`
    common/                      # app-wide building blocks: PageHeader, QueryStateBoundary, StatusBadge, form/FormTextField…
  config/                        # env.js (API_BASE_URL), inventoryRules.js (LOW_STOCK_THRESHOLD)
  lib/
    api/httpClient.js            # fetch wrapper, ApiError, buildQueryString
    api/queryClient.js           # the one QueryClient (retry 1, no refetch on focus, 15s staleTime)
    api/queryKeys.js             # every query key + QUERY_KEY_ROOTS for prefix invalidation
    api/responseMappers.js       # extractList, mapOutletMenuItemFromApi
    formatters.js                # formatCurrency (৳), formatDate, formatDateTime, toMoneyString
    generateClientId.js, utils.js (cn)
  features/
    view-as/      # who the app is viewed as (HQ or an outlet), persisted in localStorage
    outlets/      # list + create, OutletSelect (reused by Assignments and Inventory)
    menu-items/   # master menu CRUD + activate/deactivate
    assignments/  # per-outlet price override + availability
    inventory/    # stock table, restock / adjust dialog
    reports/      # revenue by outlet, top items
    pos/          # menu tiles, cart (usePosCart), idempotent checkout (useCheckoutMutation), receipt
  styles/globals.css             # Tailwind import + shadcn theme tokens (+ success / warning / brand)
```

Every feature uses the same sub-folders (only the ones it needs):

| Folder | Holds | Naming |
|---|---|---|
| `api/` | endpoint functions + API→UI mappers | `fetchOutlets`, `createSale`, `mapOutletFromApi` |
| `hooks/` | TanStack Query hooks (invalidation lives here) | `useOutletsQuery`, `useCreateOutletMutation` |
| `schemas/` | zod form schemas + default values | `outletFormSchema`, `OUTLET_FORM_DEFAULT_VALUES` |
| `components/` | feature UI | `CreateOutletDialog`, `InventoryTable` |
| `pages/` | route components (named exports) | `OutletsPage` |
| `utils/`, `constants.js` | pure helpers, UPPER_SNAKE constants | `canSellMenuItem`, `STOCK_CHANGE_TYPES` |

**Rules**
- A feature may import another feature's hooks and exported components (e.g. Assignments uses `useMenuItemsQuery` and `OutletSelect`), never its api functions directly.
- Server state lives in TanStack Query only. Mutations invalidate by key from `queryKeys.js`. Toasts and closing dialogs happen at the call site (`mutate(vars, { onSuccess })`), so hooks stay UI-agnostic.
- Naming: booleans `is*/has*/can*`, handlers `handle*`, callbacks props `on*`, no single-letter variables.
- `@/` is an alias for `src/` (see `vite.config.js` and `jsconfig.json`).
