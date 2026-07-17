const express = require("express");

const { login, logout, me, refresh, register } = require("../controllers/authController");
const { requireAuth, resolveActiveCompany } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const {
  validateLogin,
  validateRefresh,
  validateRegister
} = require("../validators/authValidators");

const authRouter = express.Router();

authRouter.post("/register", validate(validateRegister), register);
authRouter.post("/login", validate(validateLogin), login);
authRouter.post("/refresh", validate(validateRefresh), refresh);
authRouter.post("/logout", validate(validateRefresh), logout);
authRouter.get("/me", requireAuth, resolveActiveCompany, me);

module.exports = {
  authRouter
};
