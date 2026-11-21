const healthRepository = require("./health.repository");
const AppError = require("../../shared/utils/AppError");

async function check() {
  try {
    await healthRepository.ping();
  } catch (err) {
    console.error("Health check: DB ping failed:", err.message);
    throw new AppError(503, "DB_UNAVAILABLE", "Database is unreachable", { status: "error", db: "down" });
  }
  return { status: "ok", db: "up" };
}

module.exports = { check };
