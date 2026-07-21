const express = require("express");
const { getFiscalYears, postFiscalYear, activateFiscalYear, postLockFiscalYear } = require("../controllers/fiscalYearController");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateFiscalYear } = require("../validators/accountingValidators");
const { ApiError } = require("../utils/apiError");

const fiscalYearRouter = express.Router();
fiscalYearRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles("OWNER", "ADMIN"));
fiscalYearRouter.get("/", getFiscalYears);
fiscalYearRouter.post("/", validate(validateFiscalYear), postFiscalYear);
fiscalYearRouter.patch("/:fiscalYearId", (request, _response, next) => {
  if (request.body && request.body.isActive === true && Object.keys(request.body).length === 1) return next();
  return next(new ApiError(400, "Only { isActive: true } is supported."));
}, activateFiscalYear);
fiscalYearRouter.post("/:fiscalYearId/close", postLockFiscalYear);

module.exports = { fiscalYearRouter };
