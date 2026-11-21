const { z } = require("zod");

const INT4_MAX = 2147483647;

// Positive DB id from a URL param ("12" → 12). Max = Postgres INT4, so huge ids are a 400, not a Prisma 500.
const id = z.coerce.number().int().positive().max(INT4_MAX);

// Positive DB id inside a JSON body: must be a real number ("5" → 400).
const bodyId = z.number().int().positive().max(INT4_MAX);

// Decimal(10,2): ≥ 0, ≤ 99,999,999.99, at most 2 decimals.
const money = z
  .number()
  .min(0)
  .max(99999999.99)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9, {
    error: "At most 2 decimal places",
  });

const idParam = z.object({ id });

module.exports = { INT4_MAX, id, bodyId, money, idParam };
