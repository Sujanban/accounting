const test = require("node:test");
const assert = require("node:assert/strict");
const { validateOrderFulfillment } = require("../src/validators/orderFulfillmentValidators");

const warehouseId = "507f1f77bcf86cd799439011";

test("accepts an order fulfillment with an optional BS date", () => {
  assert.deepEqual(validateOrderFulfillment({ warehouseId, fulfillmentDate: "2083-04-14" }), []);
  assert.deepEqual(validateOrderFulfillment({ warehouseId }), []);
});

test("rejects fulfillment fields outside the allowlist and invalid values", () => {
  const errors = validateOrderFulfillment({
    warehouseId: "not-an-id",
    fulfillmentDate: "2083-13-01",
    status: "POSTED",
  });

  assert.deepEqual(errors, [
    { field: "status", message: "This field cannot be modified." },
    { field: "warehouseId", message: "Warehouse must be a valid identifier." },
    { field: "fulfillmentDate", message: "Fulfillment date must be a valid Bikram Sambat date in YYYY-MM-DD format." },
  ]);
});
