const { z } = require("zod");
const { idParam } = require("./common.validator");

const name = z.string().trim().min(1).max(100);
// toUpperCase() overwrites the value before regex runs, so "dha" is accepted as "DHA".
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,10}$/, { error: "Code must be 2-10 letters (A-Z)" });
const location = z.string().trim().min(1).max(255).nullable();

const createOutlet = {
  body: z.strictObject({
    name,
    code,
    location: location.optional(),
  }),
};

const updateOutlet = {
  params: idParam,
  body: z
    .strictObject({
      name: name.optional(),
      location: location.optional(), // null clears it
      // Code is printed on existing receipts; changing it would break receipt history.
      code: z.never({ error: "Outlet code cannot be changed: it is printed on existing receipts" }).optional(),
    })
    .refine((b) => b.name !== undefined || b.location !== undefined, {
      error: "Provide at least one of: name, location",
    }),
};

const outletIdParam = { params: idParam };

module.exports = { createOutlet, updateOutlet, outletIdParam };
