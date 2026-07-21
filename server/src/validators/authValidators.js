function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

function validateRegister(body) {
  const errors = [];

  if (!body.name || body.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters." });
  }

  if (!isValidEmail(body.email)) {
    errors.push({ field: "email", message: "A valid email is required." });
  }

  if (!body.password || body.password.length < 8) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters."
    });
  } else if (!isStrongPassword(body.password)) {
    errors.push({
      field: "password",
      message:
        "Password must include uppercase, lowercase, number, and special character."
    });
  }

  if (body.confirmPassword !== body.password) {
    errors.push({
      field: "confirmPassword",
      message: "Confirm password must match password."
    });
  }

  return errors;
}

function validateLogin(body) {
  const errors = [];

  if (!isValidEmail(body.email)) {
    errors.push({ field: "email", message: "A valid email is required." });
  }

  if (!body.password) {
    errors.push({ field: "password", message: "Password is required." });
  }

  return errors;
}

function validateRefresh(body) {
  const errors = [];

  if (!body.refreshToken || typeof body.refreshToken !== "string") {
    errors.push({
      field: "refreshToken",
      message: "Refresh token is required."
    });
  }

  return errors;
}

module.exports = {
  validateRegister,
  validateLogin,
  validateRefresh
};
const { isValidEmail } = require("../utils/email");
