const { EVENTS, subscribe } = require("../../shared/events/eventBus");

// Closers of all open SSE streams, so shutdown can end them (otherwise server.close() waits forever).
const openStreams = new Set();

// Registers an open stream. Returns a release function that unsubscribes and unregisters it (safe to call twice).
function openSaleCreatedStream(onSaleCreated, closeStream) {
  const unsubscribe = subscribe(EVENTS.SALE_CREATED, onSaleCreated);
  openStreams.add(closeStream);
  let released = false;
  return function release() {
    if (released) return;
    released = true;
    unsubscribe();
    openStreams.delete(closeStream);
  };
}

function closeAllStreams() {
  for (const closeStream of [...openStreams]) closeStream();
}

module.exports = { openSaleCreatedStream, closeAllStreams, EVENTS };
