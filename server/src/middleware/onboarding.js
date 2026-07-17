const { ApiError } = require("../utils/apiError");

function requireCompletedOnboarding(request, _response, next) {
  if (request.auth.user.onboardingStatus !== "completed") {
    return next(
      new ApiError(
        403,
        "Company onboarding is required before accessing this resource."
      )
    );
  }

  if (!request.auth.activeCompanyId) {
    return next(
      new ApiError(
        403,
        "An active company is required before accessing this resource."
      )
    );
  }

  return next();
}

module.exports = {
  requireCompletedOnboarding
};
