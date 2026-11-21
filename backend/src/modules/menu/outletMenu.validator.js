const { z } = require("zod");
const { id } = require("../../shared/validators/common.validator");

const getMenu = { params: z.object({ outletId: id }) };

module.exports = { getMenu };
