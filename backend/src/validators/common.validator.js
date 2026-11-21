const { z } = require("zod");

const INT4_MAX = 2147483647;

// Positive DB id from a URL param ("12" → 12). Max = Postgres INT4, so huge ids are a 400, not a Prisma 500.
const id = z.coerce.number().int().positive().max(INT4_MAX);

const idParam = z.object({ id });

module.exports = { id, idParam };
