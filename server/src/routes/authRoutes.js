const express = require("express");

const { login, logout, me, refresh, register } = require("../controllers/authController");
const { rateLimit } = require("express-rate-limit");
const { env } = require("../config/env");
const {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear
} = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateLogin, validateRegister } = require("../validators/authValidators");

const authRouter = express.Router();
const authRateLimiter = rateLimit({ windowMs: env.rateLimitWindowMs, limit: env.authRateLimitMax, standardHeaders: "draft-8", legacyHeaders: false, skipSuccessfulRequests: true, message: { success: false, message: "Too many authentication attempts. Please try again later.", errorCode: "RATE_LIMITED" } });

authRouter.post("/register", validate(validateRegister), register);
authRouter.post("/login", authRateLimiter, validate(validateLogin), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, resolveActiveCompany, resolveActiveFiscalYear, me);

module.exports = {
  authRouter
};
