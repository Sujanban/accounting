const test = require("node:test");
const assert = require("node:assert/strict");
const { validateDisposalDraft } = require("../src/validators/fixedAssetDisposalValidators");

const ledgerIds = ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"];

test("accepts a controlled fixed-asset disposal draft", () => {
  assert.deepEqual(validateDisposalDraft({ transactionDate: "2026-07-29", proceeds: 500, accumulatedDepreciation: 300, assetCostLedgerId: ledgerIds[0], accumulatedDepreciationLedgerId: ledgerIds[1], proceedsLedgerId: ledgerIds[2], gainLossLedgerId: ledgerIds[3] }), []);
});

test("rejects invalid fixed-asset disposal fields", () => {
  const errors = validateDisposalDraft({ transactionDate: "invalid", proceeds: -1, accumulatedDepreciation: -1, assetCostLedgerId: "invalid" });
  assert.equal(errors.length, 7);
});
