const test = require("node:test");
const assert = require("node:assert/strict");

const {
  validateFiscalYear,
  validateLedger,
  validateParty,
  validateProduct,
  validateJournalEntry
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
    accountGroup: "Invalid Group",
    openingBalanceType: "SIDEWAYS"
  });

  assert.equal(errors.length, 2);
  assert.equal(errors[0].field, "accountGroup");
  assert.equal(errors[1].field, "openingBalanceType");
});

test("validateParty requires a valid email and balance type", () => {
  const errors = validateParty({
    name: "AB",
    email: "not-an-email",
    openingBalanceType: "BAD"
  });

  assert.equal(errors.length, 2);
});

test("validateProduct requires name and unit", () => {
  const errors = validateProduct({
    name: " ",
    unit: ""
  });

  assert.equal(errors.length, 2);
});

test("validateJournalEntry requires date and at least two rows", () => {
  const errors = validateJournalEntry({
    rows: [{ ledgerId: "l1", debit: 100 }]
  });

  assert.equal(errors.length, 2);
  assert.equal(errors[0].field, "date");
  assert.equal(errors[1].field, "rows");
});
