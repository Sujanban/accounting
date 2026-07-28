const test = require("node:test");
const assert = require("node:assert/strict");
const { validateEmployee } = require("../src/validators/payrollValidators");

test("employee validation allowlists editable employee-master fields", () => {
  const valid = { branchId: "507f1f77bcf86cd799439011", employeeCode: "EMP-01", name: "Asha Rai", baseSalary: 35000, email: "asha@example.com" };
  assert.deepEqual(validateEmployee(valid), []);
  assert.ok(validateEmployee({ ...valid, isActive: false }).some((error) => error.field === "isActive"));
});
