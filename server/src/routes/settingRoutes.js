const express = require("express");

const { createSettings, patchAccountingPreferences } = require("../controllers/settingController");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateCreateSettings } = require("../validators/settingValidators");
const { validateAccountingPreferences } = require("../validators/accountingValidators");

const settingRouter = express.Router();

settingRouter.post(
  "/",
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  validate(validateCreateSettings),
  createSettings
);

settingRouter.patch(
  "/accounting",
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  validate(validateAccountingPreferences),
  patchAccountingPreferences
);

module.exports = {
  settingRouter
};
