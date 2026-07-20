const reportService = require("../services/reportService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
function handler(method, message) { return asyncHandler(async (request, response) => sendSuccess(response, 200, message, await reportService[method](request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.query))); }
module.exports = { getGeneralLedger: handler("getGeneralLedger", "General ledger fetched successfully."), getTrialBalance: handler("getTrialBalance", "Trial balance fetched successfully."), getJournalRegister: handler("getJournalRegister", "Journal register fetched successfully."), getDayBook: handler("getDayBook", "Day book fetched successfully.") };
