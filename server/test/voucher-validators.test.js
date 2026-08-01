const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateVoucherDraft,
  validateVoucherUpdate
} = require("../src/validators/voucherValidators");

const branchId = "507f1f77bcf86cd799439011";

test("voucher creation accepts a selected branch", () => {
  const errors = validateVoucherDraft(
    {
      branchId,
      transactionDate: "2083-04-17",
      accountingEntries: [],
      inventoryEntries: []
    },
    "SALE"
  );

  assert.deepEqual(errors, []);
});

test("voucher draft editing accepts a selected branch", () => {
  assert.deepEqual(validateVoucherUpdate({ branchId }), []);
});
