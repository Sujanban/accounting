const { FiscalYear } = require("../models/FiscalYear");
const { ApiError } = require("../utils/apiError");
const { ERROR_CODES } = require("../shared/constants/errors");

async function assertFiscalYearWritable(companyId, fiscalYearId) {
  const fiscalYear = await FiscalYear.findOne({
    _id: fiscalYearId,
    companyId
  }).lean();

  if (!fiscalYear) {
    throw new ApiError(404, "Fiscal year was not found.");
  }

  if (fiscalYear.isLocked) {
    throw new ApiError(
      403,
      "The active fiscal year is locked and cannot be modified.",
      ERROR_CODES.FISCAL_YEAR_LOCKED
    );
  }

  return fiscalYear;
}

module.exports = {
  assertFiscalYearWritable
};
