// Load env before anything that reads it (app, prisma).
require("dotenv").config({ quiet: true });

const app = require("./app");
const prisma = require("./shared/db/prisma");
const events = require("./modules/events");

const PORT = Number(process.env.PORT) || 3000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = app.listen(PORT, (err) => {
  if (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
  console.log(`API listening on :${PORT} (${process.env.NODE_ENV || "no NODE_ENV"})`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down...`);

  // If something hangs (e.g. a stuck keep-alive connection), force exit.
  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    // Open SSE streams would keep server.close() waiting until the force-exit timeout.
    events.closeAllStreams();
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
    console.log("HTTP server closed");
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
