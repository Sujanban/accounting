const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCreateTransaction } = require("../src/validators/transactionValidators");

test("transaction validation rejects incompatible transaction and voucher types", () => {
  const errors = validateCreateTransaction({ transactionType: "SALE", voucherType: "JV", transactionDate: "2026-07-24", accountingEntries: [], inventoryEntries: [] });
  assert.deepEqual(errors, [{ field: "voucherType", message: "Voucher type is not compatible with the transaction type." }]);
});

test("transaction validation accepts a compatible journal draft", () => {
  const errors = validateCreateTransaction({ transactionType: "JOURNAL", voucherType: "JV", transactionDate: "2026-07-24", accountingEntries: [], inventoryEntries: [] });
  assert.deepEqual(errors, []);
});

test("transaction validation rejects malformed nested accounting and inventory input", () => {
  const errors = validateCreateTransaction({
    transactionType: "JOURNAL", voucherType: "JV", transactionDate: "2026-07-24",
    accountingEntries: [{ ledgerId: "invalid", debit: "100", credit: 0 }],
    inventoryEntries: [{ productId: "invalid", warehouseId: "invalid", quantity: 0, unitCost: -1, direction: "SIDEWAYS" }]
  });
  assert.deepEqual(errors.map((error) => error.field), [
    "accountingEntries[0].ledgerId", "accountingEntries[0].debit",
    "inventoryEntries[0].productId", "inventoryEntries[0].warehouseId", "inventoryEntries[0].quantity", "inventoryEntries[0].unitCost", "inventoryEntries[0].direction"
  ]);
});

test("draft updates cannot change transaction or voucher types", () => {
  const { validateUpdateTransaction } = require("../src/validators/transactionValidators");
  const errors = validateUpdateTransaction({ transactionType: "SALE" });
  assert.deepEqual(errors, [{ field: "transactionType", message: "This field cannot be modified." }]);
});
