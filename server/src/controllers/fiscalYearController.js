const {
  createFiscalYear,
  listFiscalYears,
  lockFiscalYear,
  switchFiscalYear
} = require("../services/fiscalYearService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getFiscalYears = asyncHandler(async (request, response) => {
  const data = await listFiscalYears(request.auth.activeCompanyId);
  return sendSuccess(response, 200, "Fiscal years fetched successfully.", data);
});

const postFiscalYear = asyncHandler(async (request, response) => {
  const data = await createFiscalYear(request.auth.activeCompanyId, request.body);
  return sendSuccess(response, 201, "Fiscal year created successfully.", data);
});

const activateFiscalYear = asyncHandler(async (request, response) => {
  const data = await switchFiscalYear(
    request.auth.activeCompanyId,
    request.params.fiscalYearId
  );
  return sendSuccess(response, 200, "Fiscal year switched successfully.", data);
});

const postLockFiscalYear = asyncHandler(async (request, response) => {
  const data = await lockFiscalYear(
    request.auth.activeCompanyId,
    request.params.fiscalYearId
  );
  return sendSuccess(response, 200, "Fiscal year locked successfully.", data);
});

module.exports = {
  getFiscalYears,
  postFiscalYear,
  activateFiscalYear,
  postLockFiscalYear
};
