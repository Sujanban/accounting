const { createSettingsForCompany } = require("../services/settingService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const createSettings = asyncHandler(async (request, response) => {
  const result = await createSettingsForCompany(
    request.auth.user._id,
    request.auth.activeCompanyId,
    request.body
  );

  return sendSuccess(
    response,
    201,
    "Company settings created successfully. Onboarding completed.",
    result
  );
});

module.exports = {
  createSettings
};
