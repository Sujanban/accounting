const { buildSessionPayload } = require("../services/sessionService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const bootstrapDashboard = asyncHandler(async (request, response) => {
  const session = await buildSessionPayload(
    request.auth.user,
    request.auth.activeCompanyId
  );

  return sendSuccess(response, 200, "Dashboard bootstrap fetched successfully.", {
    ...session,
    summary: {
      totalAccounts: 0,
      totalInvoices: 0,
      totalCustomers: 0
    }
  });
});

module.exports = {
  bootstrapDashboard
};
