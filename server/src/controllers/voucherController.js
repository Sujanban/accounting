const voucherService = require("../services/voucherService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

function createVoucherController(definition) {
  return asyncHandler(async (request, response) => {
    const data = await voucherService.createVoucher(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.auth.user._id, definition, request.body);
    return sendSuccess(response, 201, `${definition.label} draft created successfully.`, data);
  });
}

function postVoucherController(definition) {
  return asyncHandler(async (request, response) => {
    const data = await voucherService.postVoucher(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id, definition.transactionType);
    return sendSuccess(response, 200, `${definition.label} posted successfully.`, data);
  });
}

module.exports = { createVoucherController, postVoucherController };
