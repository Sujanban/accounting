const { getAccountingDashboard } = require("../services/accountingDashboardService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getAccountingOverview = asyncHandler(async (request, response) => {
  const data = await getAccountingDashboard(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId
  );

  return sendSuccess(response, 200, "Accounting dashboard fetched successfully.", data);
});

module.exports = {
  getAccountingOverview
};
