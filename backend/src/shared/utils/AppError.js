class AppError extends Error {
  /**
   * @param {number} statusCode HTTP status
   * @param {string} code       machine-readable code, e.g. "INSUFFICIENT_STOCK"
   * @param {string} message    human-readable message
   * @param {*} [details]       optional extra info for the client
   */
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

module.exports = AppError;
