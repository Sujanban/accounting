const { Membership } = require("../models/Membership");
const { User } = require("../models/User");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/token");

const requireAuth = asyncHandler(async (request, _response, next) => {
  const authorizationHeader = request.headers.authorization || "";
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authorization token is required.");
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired access token.");
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, "User session is no longer valid.");
  }

  request.auth = {
    user
  };

  next();
});

const resolveActiveCompany = asyncHandler(async (request, _response, next) => {
  const companyIdHeader = request.get("x-company-id");
  const memberships = await Membership.find({ userId: request.auth.user._id }).lean();

  if (!memberships.length) {
    request.auth.membership = null;
    request.auth.activeCompanyId = null;
    return next();
  }

  let activeMembership = null;

  if (companyIdHeader) {
    activeMembership = memberships.find(
      (membership) => String(membership.companyId) === String(companyIdHeader)
    );

    if (!activeMembership) {
      throw new ApiError(403, "You do not have access to the requested company.");
    }
  } else if (memberships.length === 1) {
    activeMembership = memberships[0];
  }

  request.auth.memberships = memberships;
  request.auth.membership = activeMembership || null;
  request.auth.activeCompanyId = activeMembership ? activeMembership.companyId : null;

  next();
});

module.exports = {
  requireAuth,
  resolveActiveCompany
};
