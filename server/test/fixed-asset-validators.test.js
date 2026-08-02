const test = require("node:test");
const assert = require("node:assert/strict");
const { validateFixedAsset } = require("../src/validators/fixedAssetValidators");

const validAsset = {
  branchId: "507f1f77bcf86cd799439011",
  category: "Computer",
  purchaseDate: "2083-04-18",
  purchaseValue: 100000,
  salvageValue: 10000,
  usefulLifeMonths: 60,
  depreciationMethod: "STRAIGHT_LINE",
};

test("validateFixedAsset accepts an asset without an asset code", () => {
  assert.deepEqual(validateFixedAsset(validAsset), []);
});

test("validateFixedAsset rejects the removed asset code field", () => {
  const errors = validateFixedAsset({ ...validAsset, assetCode: "COMP-001" });
  assert.deepEqual(errors, [
    { field: "assetCode", message: "This field cannot be modified." },
  ]);
});
