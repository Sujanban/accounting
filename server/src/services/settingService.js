const { Company } = require("../models/Company");
const { Membership } = require("../models/Membership");
const { Setting } = require("../models/Setting");
const { User } = require("../models/User");
const { ApiError } = require("../utils/apiError");
const { buildSessionPayload } = require("./sessionService");

function mapSetting(setting) {
  return {
    id: setting._id,
    companyId: setting.companyId,
    businessType: setting.businessType,
    currency: setting.currency,
    currencySymbol: setting.currencySymbol,
    language: setting.language,
    dateFormat: setting.dateFormat,
    timezone: setting.timezone,
    decimalPlaces: setting.decimalPlaces,
    allowNegativeStock: setting.allowNegativeStock
  };
}

async function createSettingsForCompany(userId, companyId, payload) {
  const membership = await Membership.findOne({ userId, companyId }).lean();

  if (!membership) {
    throw new ApiError(403, "You do not have access to this company.");
  }

  const existingSettings = await Setting.findOne({ companyId }).lean();

  if (existingSettings) {
    throw new ApiError(409, "Company settings have already been configured.");
  }

  const company = await Company.findById(companyId);

  if (!company) {
    throw new ApiError(404, "Company was not found.");
  }

  const setting = await Setting.create({
    companyId,
    businessType: payload.businessType,
    currency: payload.currency || "NPR",
    currencySymbol: payload.currencySymbol || "Rs.",
    language: payload.language || "en",
    dateFormat: payload.dateFormat || "BS",
    timezone: payload.timezone || "Asia/Kathmandu",
    decimalPlaces:
      payload.decimalPlaces !== undefined ? Number(payload.decimalPlaces) : 2,
    allowNegativeStock:
      payload.allowNegativeStock !== undefined
        ? payload.allowNegativeStock
        : false,
    createdBy: userId,
    updatedBy: userId
  });

  company.onboardingCompleted = true;
  company.updatedBy = userId;
  await company.save();

  const user = await User.findById(userId);
  const session = await buildSessionPayload(user, companyId);

  return {
    settings: mapSetting(setting),
    session
  };
}

module.exports = {
  createSettingsForCompany,
  mapSetting
};
