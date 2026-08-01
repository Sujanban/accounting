const test = require("node:test");
const assert = require("node:assert/strict");
const { validateWarehouse } = require("../src/validators/enterpriseValidators");

const branchId = "507f1f77bcf86cd799439011";

test("warehouse validation accepts all editable warehouse details without a code", () => {
  assert.deepEqual(validateWarehouse({
    branchId,
    name: "Main warehouse",
    address: "Kathmandu",
    description: "Primary inventory location",
    isDefault: true
  }), []);
});

test("warehouse validation rejects the removed warehouse code field", () => {
  assert.deepEqual(validateWarehouse({ branchId, name: "Main warehouse", warehouseCode: "MAIN" }), [
    { field: "warehouseCode", message: "This field cannot be modified." }
  ]);
});
