const { z } = require("zod");
const { idParam } = require("./common.validator");

// Decimal(10,2): ≥ 0, ≤ 99,999,999.99, at most 2 decimals.
const money = z
  .number()
  .min(0)
  .max(99999999.99)
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9, {
    error: "At most 2 decimal places",
  });

const sku = z.string().trim().toUpperCase().min(1).max(50);
const name = z.string().trim().min(1).max(150);

const createMenuItem = {
  body: z.strictObject({
    sku,
    name,
    basePrice: money,
    isActive: z.boolean().optional(),
  }),
};

const updateMenuItem = {
  params: idParam,
  body: z
    .strictObject({
      name: name.optional(),
      basePrice: money.optional(),
      isActive: z.boolean().optional(),
    })
    .refine((b) => Object.values(b).some((v) => v !== undefined), {
      error: "Provide at least one of: name, basePrice, isActive",
    }),
};

const listMenuItems = {
  query: z.object({
    // Not z.coerce.boolean(): that would turn "false" into true.
    isActive: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
  }),
};

const menuItemIdParam = { params: idParam };

module.exports = { createMenuItem, updateMenuItem, listMenuItems, menuItemIdParam };
