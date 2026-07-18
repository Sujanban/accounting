const {
  listVoucherSequences,
  updateVoucherSequence
} = require("../services/voucherSequenceService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getVoucherSequences = asyncHandler(async (request, response) => {
  const data = await listVoucherSequences(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId
  );
  return sendSuccess(response, 200, "Voucher sequences fetched successfully.", data);
});

const patchVoucherSequence = asyncHandler(async (request, response) => {
  const data = await updateVoucherSequence(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.id,
    {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  );
  return sendSuccess(response, 200, "Voucher sequence updated successfully.", data);
});

module.exports = {
  getVoucherSequences,
  patchVoucherSequence
};
