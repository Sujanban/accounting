const { createCompanyForUser, getCompanyProfile, updateCompanyProfile } = require("../services/companyService");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const createCompany = asyncHandler(async (request, response) => {
  const result = await createCompanyForUser(request.auth.user._id, request.body);

  return sendSuccess(
    response,
    201,
    "Company created successfully.",
    result
  );
});

function assertActiveCompany(request) {
  if (!request.auth.activeCompanyId || String(request.auth.activeCompanyId) !== String(request.params.companyId)) {
    throw new ApiError(403, "You do not have access to the requested company.");
  }
}

const getCompany = asyncHandler(async (request, response) => {
  assertActiveCompany(request);
  return sendSuccess(response, 200, "Company fetched successfully.", await getCompanyProfile(request.auth.activeCompanyId));
});

const patchCompany = asyncHandler(async (request, response) => {
  assertActiveCompany(request);
  return sendSuccess(response, 200, "Company updated successfully.", await updateCompanyProfile(request.auth.activeCompanyId, request.auth.user._id, request.body));
});

module.exports = {
  createCompany,
  getCompany,
  patchCompany
};
