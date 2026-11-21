const { z } = require("zod");
const { idParam, money } = require("../../shared/validators/common.validator");

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
