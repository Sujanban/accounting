const { ApiError } = require("../utils/apiError");
const { ERROR_CODES } = require("../shared/constants/errors");

function requireCompletedOnboarding(request, _response, next) {
  if (!request.context.company || !request.context.company.onboardingCompleted) {
    return next(
      new ApiError(
        403,
        "Company onboarding is required before accessing this resource.",
        ERROR_CODES.ONBOARDING_REQUIRED
      )
    );
  }

  if (!request.context.settings) {
    return next(
      new ApiError(
        403,
        "Company settings must be configured before accessing this resource.",
        ERROR_CODES.ONBOARDING_REQUIRED
      )
    );
  }

  return next();
}

module.exports = {
  requireCompletedOnboarding
};
