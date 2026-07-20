const { Company } = require("../models/Company");
const { Setting } = require("../models/Setting");
const { FiscalYear } = require("../models/FiscalYear");
const { Journal } = require("../models/Journal");
const { ApiError } = require("../utils/apiError");

function mapPan(company) {
  return { panNumber: company.panNumber, registrationDate: company.panRegistrationDate, registrationOffice: company.panRegistrationOffice, validationStatus: company.panValidationStatus, vatRegistered: company.vatRegistered, vatNumber: company.vatNumber };
}

async function getPan(companyId) {
  const company = await Company.findById(companyId).lean();
  if (!company) throw new ApiError(404, "Company was not found.");
  return mapPan(company);
}

async function updatePan(companyId, actorUserId, payload) {
  const company = await Company.findById(companyId);
  if (!company) throw new ApiError(404, "Company was not found.");
  if (payload.panNumber !== undefined) company.panNumber = payload.panNumber.trim();
  if (payload.registrationDate !== undefined) company.panRegistrationDate = payload.registrationDate ? new Date(payload.registrationDate) : null;
  if (payload.registrationOffice !== undefined) company.panRegistrationOffice = payload.registrationOffice ? payload.registrationOffice.trim() : null;
  company.panValidationStatus = "UNVERIFIED"; company.updatedBy = actorUserId;
  await company.save();
  return mapPan(company);
}

async function getVat(companyId) {
  const [company, setting] = await Promise.all([Company.findById(companyId).lean(), Setting.findOne({ companyId }).lean()]);
  if (!company || !setting) throw new ApiError(404, "Company localization settings were not found.");
  return { vatRegistered: company.vatRegistered, vatNumber: company.vatNumber, defaultVatRate: setting.localization?.defaultVatRate ?? 13, vatMode: setting.localization?.vatMode ?? "EXCLUSIVE" };
}

async function updateVat(companyId, actorUserId, payload) {
  const [company, setting] = await Promise.all([Company.findById(companyId), Setting.findOne({ companyId })]);
  if (!company || !setting) throw new ApiError(404, "Company localization settings were not found.");
  if (payload.vatRegistered !== undefined) company.vatRegistered = payload.vatRegistered;
  if (payload.vatNumber !== undefined) company.vatNumber = payload.vatNumber ? payload.vatNumber.trim() : null;
  if (!company.vatRegistered) company.vatNumber = null;
  setting.localization = { ...setting.localization.toObject(), ...(payload.defaultVatRate !== undefined ? { defaultVatRate: Number(payload.defaultVatRate) } : {}), ...(payload.vatMode !== undefined ? { vatMode: payload.vatMode } : {}) };
  company.updatedBy = actorUserId; setting.updatedBy = actorUserId;
  await Promise.all([company.save(), setting.save()]);
  return getVat(companyId);
}

function calculateVat(amount, rate = 13, mode = "EXCLUSIVE") {
  const value = Number(amount); const percentage = Number(rate);
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new ApiError(422, "Amount and VAT rate must be valid non-negative values.");
  const taxableAmount = mode === "INCLUSIVE" ? value / (1 + percentage / 100) : value;
  const vatAmount = taxableAmount * (percentage / 100);
  return { taxableAmount: Number(taxableAmount.toFixed(2)), vatAmount: Number(vatAmount.toFixed(2)), totalAmount: Number((mode === "INCLUSIVE" ? value : value + vatAmount).toFixed(2)), rate: percentage, mode };
}

async function closeFiscalYear(companyId, fiscalYearId, actorUserId) {
  const fiscalYear = await FiscalYear.findOne({ _id: fiscalYearId, companyId });
  if (!fiscalYear) throw new ApiError(404, "Fiscal year was not found.");
  if (fiscalYear.isLocked) throw new ApiError(409, "Fiscal year is already closed.");
  const totals = await Journal.aggregate([{ $match: { companyId, fiscalYearId } }, { $group: { _id: null, debit: { $sum: "$totalDebit" }, credit: { $sum: "$totalCredit" } } }]);
  const debit = totals[0]?.debit || 0; const credit = totals[0]?.credit || 0;
  if (Math.abs(debit - credit) > 0.000001) throw new ApiError(422, "Fiscal year cannot close because journals are not balanced.");
  fiscalYear.isLocked = true; fiscalYear.updatedBy = actorUserId; await fiscalYear.save();
  return { id: fiscalYear._id, name: fiscalYear.name, isLocked: fiscalYear.isLocked, totalDebit: debit, totalCredit: credit };
}

module.exports = { getPan, updatePan, getVat, updateVat, calculateVat, closeFiscalYear };
