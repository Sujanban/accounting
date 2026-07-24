const test = require("node:test");
const assert = require("node:assert/strict");

const { validateCreateContact, validateCatalogUpdate } = require("../src/validators/businessMasterValidators");

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
