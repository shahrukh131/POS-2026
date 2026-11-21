const { z } = require("zod");
const { id } = require("./common.validator");

const getMenu = { params: z.object({ outletId: id }) };

module.exports = { getMenu };
