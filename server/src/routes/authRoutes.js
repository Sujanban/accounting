const express = require("express");

const { login, logout, me, refresh, register } = require("../controllers/authController");
const {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear
} = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateLogin, validateRegister } = require("../validators/authValidators");

const authRouter = express.Router();

authRouter.post("/register", validate(validateRegister), register);
authRouter.post("/login", validate(validateLogin), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, resolveActiveCompany, resolveActiveFiscalYear, me);

module.exports = {
  authRouter
};
