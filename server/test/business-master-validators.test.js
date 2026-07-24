const test = require("node:test");
const assert = require("node:assert/strict");

const { validateCreateContact, validateCatalogUpdate, validateContactLedgerMapping } = require("../src/validators/businessMasterValidators");

test("validateCreateContact rejects a malformed contact group ID", () => {
  const errors = validateCreateContact({
    contactCode: "CUS-001",
    name: "Example Customer",
    roles: ["CUSTOMER"],
    contactGroupId: "Corrupti in qui aut"
  });

  assert.deepEqual(errors, [
    { field: "contactGroupId", message: "Contact group ID must be a valid identifier." }
  ]);
});

test("validateCreateContact accepts a valid contact group ID", () => {
  const errors = validateCreateContact({
    contactCode: "CUS-001",
    name: "Example Customer",
    roles: ["CUSTOMER"],
    contactGroupId: "507f1f77bcf86cd799439011"
  });

  assert.deepEqual(errors, []);
});

test("contact ledger mappings accept only a statement role and ledger identifier", () => {
  assert.deepEqual(validateContactLedgerMapping({ role: "VENDOR", ledgerId: "invalid" }), [
    { field: "role", message: "Role must be CUSTOMER or SUPPLIER." },
    { field: "ledgerId", message: "Ledger must be a valid identifier." }
  ]);
  assert.deepEqual(validateContactLedgerMapping({ role: "CUSTOMER", ledgerId: "507f1f77bcf86cd799439011" }), []);
});

test("catalog updates reject server-controlled and unknown fields", () => {
  const errors = validateCatalogUpdate("products")({ name: "Office chair", companyId: "507f1f77bcf86cd799439011" });

  assert.deepEqual(errors, [
    { field: "companyId", message: "This field cannot be modified." }
  ]);
});

test("product updates validate referenced identifiers before persistence", () => {
  const errors = validateCatalogUpdate("products")({ unitId: "not-an-object-id" });

  assert.deepEqual(errors, [
    { field: "unitId", message: "Unit must be a valid identifier." }
  ]);
});
