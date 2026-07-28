const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAttendanceVoucher } = require("../src/validators/attendanceValidators");

test("attendance vouchers require allowlisted, valid employee entries", () => {
  const valid = { attendanceDate: "2026-07-28", entries: [{ employeeId: "507f1f77bcf86cd799439011", attendanceType: "PRESENT", units: 1 }] };
  assert.deepEqual(validateAttendanceVoucher(valid), []);
  assert.ok(validateAttendanceVoucher({ ...valid, status: "POSTED" }).some((error) => error.field === "status"));
});
