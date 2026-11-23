const eventsService = require("./events.service");

const HEARTBEAT_INTERVAL_MS = 25_000;
const RECONNECT_DELAY_MS = 5_000;

// GET /api/hq/events: Server-Sent Events stream for HQ screens.
// Sends "sale.created" { outletId, receiptNo } after a sale commits, plus a heartbeat comment every 25s
// so proxies and load balancers don't close an idle connection.
function stream(req, res) {
  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // stop nginx-style proxies from buffering the stream
  });
  res.flushHeaders();

  // Never write after the stream ended: that emits an unhandled 'error' on res.
  const send = (chunk) => {
    if (!res.writableEnded && !res.destroyed) res.write(chunk);
  };

  send(`retry: ${RECONNECT_DELAY_MS}\n\n`);
  send(": connected\n\n");

  const onSaleCreated = (payload) => {
    send(`event: ${eventsService.EVENTS.SALE_CREATED}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  const heartbeat = setInterval(() => send(": heartbeat\n\n"), HEARTBEAT_INTERVAL_MS);
  heartbeat.unref();

  // Runs once, whether the client disconnects or the server shuts down.
  let release = () => {};
  const cleanup = () => {
    clearInterval(heartbeat);
    release();
  };
  release = eventsService.openSaleCreatedStream(onSaleCreated, () => {
    cleanup();
    if (!res.writableEnded) res.end();
  });

  req.on("close", cleanup);
}

module.exports = { stream };
