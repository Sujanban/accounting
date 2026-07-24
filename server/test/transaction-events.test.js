const test = require("node:test");
const assert = require("node:assert/strict");
const { eventBus } = require("../src/events/eventBus");
const { DOMAIN_EVENTS } = require("../src/shared/constants/events");

test("transaction lifecycle events deliver the committed payload to listeners", async () => {
  const payload = { transaction: { id: "transaction-id" }, companyId: "company-id" };
  let received = null;
  const listener = async (event) => { received = event; };
  eventBus.once(DOMAIN_EVENTS.TRANSACTION_REVERSED, listener);

  await eventBus.emitAsync(DOMAIN_EVENTS.TRANSACTION_REVERSED, payload);

  assert.deepEqual(received, payload);
});
