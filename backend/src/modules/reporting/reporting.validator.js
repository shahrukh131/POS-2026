const { z } = require("zod");
const { id } = require("../../shared/validators/common.validator");

// Rule 30: optional ISO dates (YYYY-MM-DD), inclusive, UTC. from > to → 400.
const isoDate = z.iso.date();
const dateRangeShape = { from: isoDate.optional(), to: isoDate.optional() };

// ISO dates compare correctly as strings.
const fromLteTo = [
  (q) => !q.from || !q.to || q.from <= q.to,
  { error: "`from` must be on or before `to`", path: ["to"] },
];

const revenueByOutlet = {
  query: z.object(dateRangeShape).refine(...fromLteTo),
};

// Rule 31: top items per outlet. outletId omitted = all outlets.
const topItems = {
  query: z
    .object({
      ...dateRangeShape,
      outletId: id.optional(),
      limit: z.coerce.number().int().min(1).max(50).default(5),
    })
    .refine(...fromLteTo),
};

module.exports = { revenueByOutlet, topItems };
