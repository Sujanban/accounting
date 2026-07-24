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
