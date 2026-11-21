const { Prisma } = require("@prisma/client");
const AppError = require("../utils/AppError");

const CHECK_VIOLATION = "23514";

// Prisma 6 has no dedicated error code for CHECK constraints. They arrive either as
// P2010 (raw query) with meta.code = "23514", or as an "unknown request" error whose
// message contains the Postgres code / text.
function isCheckViolation(err) {
  if (err?.meta?.code === CHECK_VIOLATION) return true;
  const isPrismaError =
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError;
  return (
    isPrismaError &&
    typeof err.message === "string" &&
    (err.message.includes(CHECK_VIOLATION) || err.message.includes("violates check constraint"))
  );
}

function checkConstraintName(message = "") {
  const match = message.match(/violates check constraint \\?"([^"\\]+)\\?"/);
  return match ? match[1] : undefined;
}

// Turns any error into { statusCode, code, message, details? }.
function normalize(err) {
  if (err instanceof AppError) {
    return { statusCode: err.statusCode, code: err.code, message: err.message, details: err.details };
  }

  // express.json() (body-parser) errors
  if (err?.type === "entity.parse.failed") {
    return { statusCode: 400, code: "INVALID_JSON", message: "Request body is not valid JSON" };
  }
  if (err?.type === "entity.too.large") {
    return { statusCode: 413, code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" };
  }

  if (isCheckViolation(err)) {
    const constraint = checkConstraintName(err.message);
    return {
      statusCode: 409,
      code: "CONSTRAINT_VIOLATION",
      message: "A database constraint was violated",
      details: constraint ? { constraint } : undefined,
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return {
          statusCode: 409,
          code: "DUPLICATE",
          message: "A record with the same unique value already exists",
          details: { fields: err.meta?.target },
        };
      case "P2025":
        return { statusCode: 404, code: "NOT_FOUND", message: "Record not found" };
      case "P2003":
        return {
          statusCode: 409,
          code: "FK_CONSTRAINT",
          message: "Related record does not exist or is still referenced",
          // Prisma 6 puts the FK name in meta.constraint (older versions: meta.field_name)
          details: { constraint: err.meta?.constraint ?? err.meta?.field_name },
        };
    }
  }

  return { statusCode: 500, code: "INTERNAL_ERROR", message: "Something went wrong" };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const { statusCode, code, message, details } = normalize(err);

  // Log unexpected failures. Deliberate AppErrors (e.g. 503 from /health) are logged where they are thrown.
  if (statusCode >= 500 && !(err instanceof AppError)) console.error(err);

  const error = { code, message };
  if (details !== undefined) error.details = details;
  if (process.env.NODE_ENV === "development" && err?.stack) error.stack = err.stack;

  res.status(statusCode).json({ success: false, error });
}

module.exports = errorHandler;
