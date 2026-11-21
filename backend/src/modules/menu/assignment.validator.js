const { z } = require("zod");
const { id, bodyId, money } = require("../../shared/validators/common.validator");

const outletParams = z.object({ outletId: id });
const assignmentParams = z.object({ outletId: id, menuItemId: id });

const createAssignment = {
  params: outletParams,
  body: z.strictObject({
    menuItemId: bodyId,
    priceOverride: money.nullable().optional(),
  }),
};

const listAssignments = { params: outletParams };

const updateAssignment = {
  params: assignmentParams,
  body: z
    .strictObject({
      priceOverride: money.nullable().optional(), // null clears the override
      isAvailable: z.boolean().optional(), // false = unassign (rule 10)
    })
    .refine((b) => b.priceOverride !== undefined || b.isAvailable !== undefined, {
      error: "Provide at least one of: priceOverride, isAvailable",
    }),
};

module.exports = { createAssignment, listAssignments, updateAssignment };
