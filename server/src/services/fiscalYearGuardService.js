const { FiscalYear } = require("../models/FiscalYear");
const { Setting } = require("../models/Setting");
const { ApiError } = require("../utils/apiError");
const { ERROR_CODES } = require("../shared/constants/errors");

async function assertFiscalYearWritable(companyId, fiscalYearId, options = {}) {
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

  if (!fiscalYear.isActive && !options.allowInactive) {
    throw new ApiError(
      403,
      "Transactions can only be created in the active fiscal year.",
      ERROR_CODES.FISCAL_YEAR_LOCKED
    );
  }

  if (options.transactionDate) {
    const transactionDate = new Date(options.transactionDate);
    if (Number.isNaN(transactionDate.getTime()) || (fiscalYear.startDateAD && transactionDate < fiscalYear.startDateAD) || (fiscalYear.endDateAD && transactionDate > fiscalYear.endDateAD)) {
      throw new ApiError(422, "The transaction date must fall within the active fiscal year.", ERROR_CODES.VALIDATION_ERROR);
    }
    const settings = await Setting.findOne({ companyId }).lean();

    if (
      settings &&
      settings.fiscalLock &&
      settings.fiscalLock.lockBeforeDate &&
      transactionDate < new Date(settings.fiscalLock.lockBeforeDate)
    ) {
      throw new ApiError(
        403,
        "The transaction date is locked by fiscal lock settings.",
        ERROR_CODES.FISCAL_YEAR_LOCKED
      );
    }
  }

  return fiscalYear;
}

module.exports = {
  assertFiscalYearWritable
};
