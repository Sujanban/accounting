const { Company } = require("../models/Company");
const { FiscalYear } = require("../models/FiscalYear");
const { Membership } = require("../models/Membership");
const { Setting } = require("../models/Setting");
const { User } = require("../models/User");
const { ApiError } = require("../utils/apiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { verifyAccessToken } = require("../utils/token");
const { ERROR_CODES } = require("../shared/constants/errors");

const requireAuth = asyncHandler(async (request, _response, next) => {
  const authorizationHeader = request.headers.authorization || "";
  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authorization token is required.", ERROR_CODES.UNAUTHORIZED);
  }

  let payload;

  try {
    payload = verifyAccessToken(token);
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired access token.", ERROR_CODES.INVALID_TOKEN);
  }

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, "User session is no longer valid.", ERROR_CODES.UNAUTHORIZED);
  }

  request.auth = {
    user
  };

  request.context = {
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
  request.context.membership = activeMembership || null;
  request.company = null;
  request.membership = activeMembership || null;

  next();
});

const resolveActiveFiscalYear = asyncHandler(async (request, _response, next) => {
  if (!request.auth.activeCompanyId) {
    request.auth.activeFiscalYearId = null;
    return next();
  }

  const company = await Company.findById(request.auth.activeCompanyId).lean();

  if (!company) {
    throw new ApiError(404, "Active company was not found.");
  }

  request.context.company = company;
  request.company = company;

  const fiscalYearIdHeader = request.get("x-fiscal-year-id");

  if (fiscalYearIdHeader) {
    request.auth.activeFiscalYearId = fiscalYearIdHeader;
  } else {
    request.auth.activeFiscalYearId = company.activeFiscalYearId || null;
  }

  const fiscalYear = request.auth.activeFiscalYearId
    ? await FiscalYear.findOne({
        _id: request.auth.activeFiscalYearId,
        companyId: company._id
      }).lean()
    : null;

  if (!fiscalYear) {
    throw new ApiError(404, "Active fiscal year was not found.");
  }

  const settings = await Setting.findOne({ companyId: company._id }).lean();

  request.context.fiscalYear = fiscalYear;
  request.context.settings = settings;
  request.fiscalYear = fiscalYear;
  request.settings = settings;
  next();
});

module.exports = {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear
};
