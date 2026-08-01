const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDepreciationDraft } = require("../src/validators/fixedAssetDepreciationValidators");

const expenseLedgerId = "507f1f77bcf86cd799439011";
const accumulatedDepreciationLedgerId = "507f1f77bcf86cd799439012";

test("accepts a manual depreciation journal draft", () => {
  assert.deepEqual(validateDepreciationDraft({ periodMonth: 1, transactionDate: "2083-04-14", expenseLedgerId, accumulatedDepreciationLedgerId }), []);
});

test("rejects unsafe and malformed depreciation journal draft input", () => {
  const errors = validateDepreciationDraft({ periodMonth: 0, transactionDate: "2083-13-01", expenseLedgerId, accumulatedDepreciationLedgerId: expenseLedgerId, status: "POSTED" });
  assert.equal(errors.length, 4);
  assert.equal(errors[0].field, "status");
  assert.equal(errors[1].field, "periodMonth");
  assert.equal(errors[2].field, "transactionDate");
  assert.equal(errors[3].field, "accumulatedDepreciationLedgerId");
});
