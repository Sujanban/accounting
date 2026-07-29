const express = require("express");

const { createCompany, getCompany, patchCompany } = require("../controllers/companyController");
const { requireAuth, resolveActiveCompany, requireRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateCreateCompany, validateCompanyUpdate } = require("../validators/companyValidators");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const tenantUsageService = require("../services/tenantUsageService");

const companyRouter = express.Router();

companyRouter.post(
  "/",
  requireAuth,
  resolveActiveCompany,
  validate(validateCreateCompany),
  createCompany
);

companyRouter.get("/:companyId", requireAuth, resolveActiveCompany, requireRoles("OWNER", "ADMIN"), getCompany);
companyRouter.get("/:companyId/usage", requireAuth, resolveActiveCompany, requireRoles("OWNER", "ADMIN"), asyncHandler(async (req, res) => sendSuccess(res, 200, "Tenant usage fetched successfully.", await tenantUsageService.getUsage(req.auth.activeCompanyId))));
companyRouter.patch("/:companyId", requireAuth, resolveActiveCompany, requireRoles("OWNER", "ADMIN"), validate(validateCompanyUpdate), patchCompany);

module.exports = {
  companyRouter
};
