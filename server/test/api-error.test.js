const test = require("node:test");
const assert = require("node:assert/strict");
const { ApiError } = require("../src/utils/apiError");

test("semantic validation errors use the validation error code", () => {
  assert.equal(new ApiError(422, "Invalid input.").errorCode, "VALIDATION_ERROR");
});
