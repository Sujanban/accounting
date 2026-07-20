const {
  archiveLedger,
  restoreLedger,
  createLedger,
  listLedgers,
  updateLedger
} = require("../services/ledgerService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

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
    {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  );
  return sendSuccess(response, 201, "Ledger created successfully.", data);
});

const patchLedger = asyncHandler(async (request, response) => {
  const data = await updateLedger(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.id,
    {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  );
  return sendSuccess(response, 200, "Ledger updated successfully.", data);
});

const archiveLedgerRecord = asyncHandler(async (request, response) => {
  const data = await archiveLedger(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.id,
    request.auth.user._id
  );
  return sendSuccess(response, 200, "Ledger deleted successfully.", data);
});

const restoreLedgerRecord = asyncHandler(async (request, response) => {
  const data = await restoreLedger(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.id,
    request.auth.user._id
  );
  return sendSuccess(response, 200, "Ledger restored successfully.", data);
});

module.exports = {
  getLedgers,
  postLedger,
  patchLedger,
  archiveLedgerRecord,
  restoreLedgerRecord
};
