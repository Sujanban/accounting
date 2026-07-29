const test = require("node:test");
const assert = require("node:assert/strict");
const { validateLeaveRequestDecision } = require("../src/validators/leaveRequestValidators");

test("leave review accepts only explicit approval decisions", () => {
  assert.deepEqual(validateLeaveRequestDecision({ status: "APPROVED" }), []);
  assert.deepEqual(validateLeaveRequestDecision({ status: "REJECTED" }), []);
  assert.equal(validateLeaveRequestDecision({ status: "PENDING" }).length, 1);
  assert.equal(validateLeaveRequestDecision({ status: "APPROVED", employeeId: "server-controlled" }).length, 1);
});
