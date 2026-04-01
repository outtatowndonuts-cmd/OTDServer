const EventEmitter = require('events');

const eventBus = new EventEmitter();

// Prevent unhandled 'error' events from crashing the process
eventBus.on('error', (err) => {
  console.error('[EventBus] Unhandled event error:', err);
});

module.exports = eventBus;
