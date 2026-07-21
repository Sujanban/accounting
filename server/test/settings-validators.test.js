const test = require("node:test");
const assert = require("node:assert/strict");
const { validateCompanyUpdate } = require("../src/validators/companyValidators");
const { validateSettingsUpdate } = require("../src/validators/settingValidators");

test("company profile updates allow only editable profile fields", () => {
  assert.deepEqual(validateCompanyUpdate({ name: "Updated Company", phone: "+9779800000000" }), []);
  assert.ok(validateCompanyUpdate({ panNumber: "123456789" }).some((error) => error.field === "panNumber"));
});

test("general settings updates reject accounting and invalid currency fields", () => {
  assert.deepEqual(validateSettingsUpdate({ currency: "NPR", currencySymbol: "Rs.", decimalPlaces: 2 }), []);
  const errors = validateSettingsUpdate({ currency: "NEPAL", accounting: { voucherNumbering: "AUTO" } });
  assert.ok(errors.some((error) => error.field === "currency"));
  assert.ok(errors.some((error) => error.field === "accounting"));
});
