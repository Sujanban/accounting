const express = require("express");

const { createCompany, getCompany, patchCompany } = require("../controllers/companyController");
const { requireAuth, resolveActiveCompany, requireRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateCreateCompany, validateCompanyUpdate } = require("../validators/companyValidators");

const companyRouter = express.Router();

companyRouter.post(
  "/",
  requireAuth,
  resolveActiveCompany,
  validate(validateCreateCompany),
  createCompany
);

companyRouter.get("/:companyId", requireAuth, resolveActiveCompany, requireRoles("OWNER", "ADMIN"), getCompany);
companyRouter.patch("/:companyId", requireAuth, resolveActiveCompany, requireRoles("OWNER", "ADMIN"), validate(validateCompanyUpdate), patchCompany);

module.exports = {
  companyRouter
};
