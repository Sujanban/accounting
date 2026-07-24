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

function getVoucherController(definition) {
  return asyncHandler(async (request, response) => sendSuccess(response, 200, `${definition.label} fetched successfully.`, await voucherService.getVoucher(request.auth.activeCompanyId, request.params.id, definition.transactionType)));
}

function listVouchersController(definition) {
  return asyncHandler(async (request, response) => sendSuccess(response, 200, `${definition.label}s fetched successfully.`, await voucherService.listVouchers(request.auth.activeCompanyId, request.auth.activeFiscalYearId, definition.transactionType, request.query)));
}

function updateVoucherController(definition) {
  return asyncHandler(async (request, response) => sendSuccess(response, 200, `${definition.label} draft updated successfully.`, await voucherService.updateVoucher(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id, definition.transactionType, request.body)));
}

module.exports = { createVoucherController, postVoucherController, getVoucherController, listVouchersController, updateVoucherController };
