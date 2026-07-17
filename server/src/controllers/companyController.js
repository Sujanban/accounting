const { createCompanyForUser } = require("../services/companyService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const createCompany = asyncHandler(async (request, response) => {
  const result = await createCompanyForUser(request.auth.user._id, request.body);

  return sendSuccess(
    response,
    201,
    "Company created successfully. Onboarding completed.",
    result
  );
});

module.exports = {
  createCompany
};
