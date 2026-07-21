const express = require("express");

const { createSettings, getSettings, patchSettings, patchAccountingPreferences } = require("../controllers/settingController");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateCreateSettings, validateSettingsUpdate } = require("../validators/settingValidators");
const { validateAccountingPreferences } = require("../validators/accountingValidators");

const settingRouter = express.Router();

settingRouter.post(
  "/",
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireRoles("OWNER", "ADMIN"),
  validate(validateCreateSettings),
  createSettings
);

settingRouter.get("/", requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles("OWNER", "ADMIN"), getSettings);
settingRouter.patch("/", requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles("OWNER", "ADMIN"), validate(validateSettingsUpdate), patchSettings);

settingRouter.patch(
  "/accounting",
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireRoles("OWNER", "ADMIN"),
  validate(validateAccountingPreferences),
  patchAccountingPreferences
);

module.exports = {
  settingRouter
};
