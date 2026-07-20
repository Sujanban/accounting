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
    allowNegativeStock: setting.allowNegativeStock,
    accounting: setting.accounting,
    fiscalLock: setting.fiscalLock
  };
}

function buildAccountingPreferences(payload) {
  return {
    voucherNumbering:
      payload.accounting && payload.accounting.voucherNumbering
        ? payload.accounting.voucherNumbering
        : "AUTO",
    decimalPlaces:
      payload.accounting && payload.accounting.decimalPlaces !== undefined
        ? Number(payload.accounting.decimalPlaces)
        : payload.decimalPlaces !== undefined
          ? Number(payload.decimalPlaces)
          : 2,
    allowJournalEditing:
      payload.accounting && payload.accounting.allowJournalEditing !== undefined
        ? payload.accounting.allowJournalEditing
        : false,
    lockAfterClosing:
      payload.accounting && payload.accounting.lockAfterClosing !== undefined
        ? payload.accounting.lockAfterClosing
        : true,
    defaultVoucherView:
      payload.accounting && payload.accounting.defaultVoucherView
        ? payload.accounting.defaultVoucherView
        : "STANDARD"
  };
}

function buildFiscalLockPreferences(payload) {
  return {
    lockBeforeDate:
      payload.fiscalLock && payload.fiscalLock.lockBeforeDate
        ? new Date(payload.fiscalLock.lockBeforeDate)
        : null,
    lockClosedFiscalYear:
      payload.fiscalLock && payload.fiscalLock.lockClosedFiscalYear !== undefined
        ? payload.fiscalLock.lockClosedFiscalYear
        : true,
    allowAdminOverride:
      payload.fiscalLock && payload.fiscalLock.allowAdminOverride !== undefined
        ? payload.fiscalLock.allowAdminOverride
        : false
  };
}

async function assertCompanyAccess(userId, companyId) {
  const membership = await Membership.findOne({ userId, companyId }).lean();

  if (!membership) {
    throw new ApiError(403, "You do not have access to this company.");
  }
}

async function createSettingsForCompany(userId, companyId, payload) {
  await assertCompanyAccess(userId, companyId);

  const company = await Company.findById(companyId);

  if (!company) {
    throw new ApiError(404, "Company was not found.");
  }

  const settingPayload = {
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
    accounting: buildAccountingPreferences(payload),
    fiscalLock: buildFiscalLockPreferences(payload),
    createdBy: userId,
    updatedBy: userId
  };

  const setting = await Setting.findOneAndUpdate(
    { companyId },
    { $set: settingPayload },
    { new: true, upsert: true, runValidators: true }
  );

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

async function updateAccountingPreferences(userId, companyId, payload) {
  await assertCompanyAccess(userId, companyId);

  const setting = await Setting.findOne({ companyId });

  if (!setting) {
    throw new ApiError(404, "Company settings were not found.");
  }

  if (payload.accounting) {
    setting.accounting = {
      ...setting.accounting,
      ...payload.accounting,
      decimalPlaces:
        payload.accounting.decimalPlaces !== undefined
          ? Number(payload.accounting.decimalPlaces)
          : setting.accounting.decimalPlaces
    };
  }

  if (payload.fiscalLock) {
    setting.fiscalLock = {
      ...setting.fiscalLock,
      ...payload.fiscalLock,
      lockBeforeDate:
        payload.fiscalLock.lockBeforeDate !== undefined
          ? payload.fiscalLock.lockBeforeDate
            ? new Date(payload.fiscalLock.lockBeforeDate)
            : null
          : setting.fiscalLock.lockBeforeDate
    };
  }

  setting.updatedBy = userId;
  await setting.save();

  return {
    settings: mapSetting(setting)
  };
}

module.exports = {
  createSettingsForCompany,
  updateAccountingPreferences,
  mapSetting
};
