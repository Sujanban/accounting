const express = require("express");

const { createSettings } = require("../controllers/settingController");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateCreateSettings } = require("../validators/settingValidators");

const settingRouter = express.Router();

settingRouter.post(
  "/",
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  validate(validateCreateSettings),
  createSettings
);

module.exports = {
  settingRouter
};
