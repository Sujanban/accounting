const { ApiError } = require("../utils/apiError");

function requireCompletedOnboarding(request, _response, next) {
  if (!request.context.company || !request.context.company.onboardingCompleted) {
    return next(
      new ApiError(
        403,
        "Company onboarding is required before accessing this resource."
      )
    );
  }

  if (!request.context.settings) {
    return next(
      new ApiError(
        403,
        "Company settings must be configured before accessing this resource."
      )
    );
  }

  return next();
}

module.exports = {
  requireCompletedOnboarding
};
