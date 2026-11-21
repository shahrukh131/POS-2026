# F&B HQ – project rules
Stack: Node (CommonJS), Express 5, Zod 4, Prisma 6.19 (multi-file schema in backend/prisma/schema), PostgreSQL 16.
DB for local dev: native Postgres on localhost:5433 (`.env` DATABASE_URL). The root docker-compose `db` service publishes 5432. That one is for the full Docker stack, not local dev.
Frontend lives in ../frontend (React, Vite). The same rules apply there, including "no new libraries without asking".

@docs/ARCHITECTURE.md
@docs/BUSINESS_RULES.md

## Rules
- Layers: route → validator → controller → service → repository. Never skip one.
- Modules (`src/modules/<x>/`): cross-module calls only via `modules/<x>/index.js`. No cycles: outlet ← inventory ← menu ← sales (see docs/ARCHITECTURE.md).
- Multi-step writes go in prisma.$transaction.
- Validate with Zod. Throw AppError; one global error middleware.
- No new libraries without asking. Only touch files the task needs.
- After changes, tell me how to test it in Postman.
- Keep docs/ in sync when the schema or endpoints change.

## Commands
- `npm run dev` → start API (nodemon)
- `npm run prisma:migrate` → create/apply migration (interactive; in non-interactive shells write SQL via `prisma migrate diff`, then `prisma migrate deploy`)
- `npm run prisma:generate` → regenerate client

## Version gotchas
- Express 5: async errors reach errorHandler natively, so don't add an `asyncHandler` wrapper. `req.query` is read-only
  (store parsed values on `req.validated`, don't reassign `req.query`).
- Zod 4: use `z.email()`, `z.coerce.number()`; read errors via `error.issues`; use `z.treeifyError()`, not `.format()`.
- CHECK constraints are hand-written SQL in migrations (`*_add_check_constraints`, `*_add_outlet_code`). Prisma can't see them, so never drop them when editing the schema.