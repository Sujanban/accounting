const test = require("node:test");
const assert = require("node:assert/strict");

const { validateLogin, validateRegister } = require("../src/validators/authValidators");

test("registration rejects malformed email domains", () => {
  const errors = validateRegister({
    name: "Sujan Ban",
    email: "bansujan+test1@gmail,.com",
    password: "StrongPass123!",
    confirmPassword: "StrongPass123!"
  });

  assert.deepEqual(errors, [{ field: "email", message: "A valid email is required." }]);
});

test("login accepts a valid email address", () => {
  assert.deepEqual(validateLogin({ email: "bansujan+test1@gmail.com", password: "StrongPass123!" }), []);
});
