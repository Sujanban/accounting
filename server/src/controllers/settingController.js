const {
  createSettingsForCompany,
  getSettingsForCompany,
  updateGeneralSettings,
  updateAccountingPreferences
} = require("../services/settingService");
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

const getSettings = asyncHandler(async (request, response) => sendSuccess(response, 200, "Company settings fetched successfully.", await getSettingsForCompany(request.auth.user._id, request.auth.activeCompanyId)));

const patchSettings = asyncHandler(async (request, response) => sendSuccess(response, 200, "Company settings updated successfully.", await updateGeneralSettings(request.auth.user._id, request.auth.activeCompanyId, request.body)));

module.exports = {
  createSettings,
  getSettings,
  patchSettings,
  patchAccountingPreferences: asyncHandler(async (request, response) => {
    const result = await updateAccountingPreferences(
      request.auth.user._id,
      request.auth.activeCompanyId,
      request.body
    );

    return sendSuccess(
      response,
      200,
      "Accounting preferences updated successfully.",
      result
    );
  })
};
