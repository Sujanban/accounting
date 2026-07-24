const { createContactLedgerMapping, listContactLedgerMappings } = require("../services/contactLedgerService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getContactLedgerMappings = asyncHandler(async (request, response) =>
  sendSuccess(response, 200, "Contact ledger mappings fetched successfully.", await listContactLedgerMappings(
    request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id
  ))
);

const postContactLedgerMapping = asyncHandler(async (request, response) =>
  sendSuccess(response, 201, "Contact ledger mapping created successfully.", await createContactLedgerMapping(
    request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id,
    { ...request.body, actorUserId: request.auth.user._id }
  ))
);

module.exports = { getContactLedgerMappings, postContactLedgerMapping };
