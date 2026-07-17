const {
  archiveLedger,
  createLedger,
  getGeneralLedger,
  getTrialBalance,
  listAccountGroups,
  listLedgers,
  updateLedger
} = require("../services/ledgerService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getAccountGroups = asyncHandler(async (request, response) => {
  const data = await listAccountGroups(request.auth.activeCompanyId);
  return sendSuccess(response, 200, "Account groups fetched successfully.", data);
});

const getLedgers = asyncHandler(async (request, response) => {
  const data = await listLedgers(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.query
  );
  return sendSuccess(response, 200, "Ledgers fetched successfully.", data);
});

const postLedger = asyncHandler(async (request, response) => {
  const data = await createLedger(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.body
  );
  return sendSuccess(response, 201, "Ledger created successfully.", data);
});

const patchLedger = asyncHandler(async (request, response) => {
  const data = await updateLedger(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.ledgerId,
    request.body
  );
  return sendSuccess(response, 200, "Ledger updated successfully.", data);
});

const archiveLedgerRecord = asyncHandler(async (request, response) => {
  const data = await archiveLedger(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.ledgerId
  );
  return sendSuccess(response, 200, "Ledger archived successfully.", data);
});

const getGeneralLedgerReport = asyncHandler(async (request, response) => {
  const data = await getGeneralLedger(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.ledgerId,
    request.query
  );
  return sendSuccess(response, 200, "General ledger fetched successfully.", data);
});

const getTrialBalanceReport = asyncHandler(async (request, response) => {
  const data = await getTrialBalance(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId
  );
  return sendSuccess(response, 200, "Trial balance fetched successfully.", data);
});

module.exports = {
  getAccountGroups,
  getLedgers,
  postLedger,
  patchLedger,
  archiveLedgerRecord,
  getGeneralLedgerReport,
  getTrialBalanceReport
};
