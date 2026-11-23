const { EventEmitter } = require("events");

// In-process event bus. Single instance only: with several API instances, publish through
// Redis pub/sub (or similar) instead, so every instance can fan out to its own SSE clients.
const EVENTS = Object.freeze({
  SALE_CREATED: "sale.created",
});

const emitter = new EventEmitter();
// One listener per open HQ tab (SSE stream), so there is no fixed upper bound.
emitter.setMaxListeners(0);

// Fire-and-forget. A failing listener must never throw back into the caller
// (e.g. a sale that has already committed must not turn into a 500).
function publish(eventName, payload) {
  try {
    emitter.emit(eventName, payload);
  } catch (err) {
    console.error(`eventBus: listener for "${eventName}" failed:`, err);
  }
}

// Returns an unsubscribe function.
function subscribe(eventName, listener) {
  emitter.on(eventName, listener);
  return () => emitter.off(eventName, listener);
}

const listenerCount = (eventName) => emitter.listenerCount(eventName);

module.exports = { EVENTS, publish, subscribe, listenerCount };
