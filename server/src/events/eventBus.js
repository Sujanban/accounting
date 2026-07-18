const EventEmitter = require("events");

class AsyncEventBus extends EventEmitter {
  async emitAsync(eventName, payload) {
    const listeners = this.listeners(eventName);

    for (const listener of listeners) {
      await listener(payload);
    }
  }
}

const eventBus = new AsyncEventBus();

module.exports = {
  eventBus
};
