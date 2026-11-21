const { z } = require("zod");
const AppError = require("../utils/AppError");

const PARTS = ["body", "params", "query"];

/**
 * validate({ body, params, query }) — each is an optional Zod schema.
 * Parsed (coerced/defaulted) values go to req.validated.{body,params,query}.
 * req.query is never reassigned (it is a read-only getter in Express 5).
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    const validated = { ...req.validated };
    const errors = {};

    for (const part of PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (result.success) validated[part] = result.data;
      else errors[part] = z.treeifyError(result.error);
    }

    if (Object.keys(errors).length > 0) {
      return next(new AppError(400, "VALIDATION_ERROR", "Request validation failed", errors));
    }

    req.validated = validated;
    next();
  };
}

module.exports = validate;
