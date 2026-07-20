const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateFiscalYear,
  validateLedger,
  validateVoucherSequence,
  validateAccountingPreferences
} = require("../src/validators/accountingValidators");

test("validateFiscalYear accepts a complete payload", () => {
  const errors = validateFiscalYear({
    name: "2082/83",
    startDateBS: "2082-04-01",
    endDateBS: "2083-03-31"
  });

  assert.deepEqual(errors, []);
});

test("validateLedger rejects invalid account groups and balance types", () => {
  const errors = validateLedger({
    name: "Cash",
    openingBalanceType: "SIDEWAYS"
  });

  assert.equal(errors.length, 2);
  assert.equal(errors[0].field, "groupId");
  assert.equal(errors[1].field, "openingBalanceType");
});

test("validateVoucherSequence rejects invalid and non-writable sequence fields", () => {
  const errors = validateVoucherSequence({
    voucherType: "BAD",
    nextNumber: 0,
    openingBalanceType: "SIDEWAYS"
  });

  assert.equal(errors.length, 3);
  assert.ok(errors.some((error) => error.field === "voucherType"));
  assert.ok(errors.some((error) => error.field === "nextNumber"));
  assert.ok(errors.some((error) => error.field === "openingBalanceType"));
});

test("validateAccountingPreferences rejects invalid accounting and lock settings", () => {
  const errors = validateAccountingPreferences({
    accounting: {
      voucherNumbering: "BAD",
      decimalPlaces: 9
    },
    fiscalLock: {
      lockBeforeDate: "not-a-date"
    }
  });

  assert.equal(errors.length, 3);
  assert.equal(errors[0].field, "accounting.voucherNumbering");
  assert.equal(errors[1].field, "accounting.decimalPlaces");
  assert.equal(errors[2].field, "fiscalLock.lockBeforeDate");
});
