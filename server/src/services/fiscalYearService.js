const { Company } = require("../models/Company");
const { FiscalYear } = require("../models/FiscalYear");
const { ApiError } = require("../utils/apiError");
const { initializeAccountingForFiscalYear } = require("./accountingBootstrapService");

function mapFiscalYear(fiscalYear) {
  return {
    id: fiscalYear._id,
    companyId: fiscalYear.companyId,
    name: fiscalYear.name,
    startDateBS: fiscalYear.startDateBS,
    endDateBS: fiscalYear.endDateBS,
    startDateAD: fiscalYear.startDateAD,
    endDateAD: fiscalYear.endDateAD,
    isActive: fiscalYear.isActive,
    isLocked: fiscalYear.isLocked,
    createdAt: fiscalYear.createdAt
  };
}

async function listFiscalYears(companyId) {
  const fiscalYears = await FiscalYear.find({ companyId }).sort({ createdAt: -1 }).lean();
  return fiscalYears.map(mapFiscalYear);
}

async function createFiscalYear(companyId, payload) {
  const activeFiscalYear = await FiscalYear.findOne({ companyId, isActive: true });

  if (activeFiscalYear) {
    activeFiscalYear.isActive = false;
    await activeFiscalYear.save();
  }

  const fiscalYear = await FiscalYear.create({
    companyId,
    name: payload.name.trim(),
    startDateBS: payload.startDateBS.trim(),
    endDateBS: payload.endDateBS.trim(),
    startDateAD: payload.startDateAD ? new Date(payload.startDateAD) : null,
    endDateAD: payload.endDateAD ? new Date(payload.endDateAD) : null,
    isActive: true,
    isLocked: false
  });

  await Company.findByIdAndUpdate(companyId, {
    activeFiscalYearId: fiscalYear._id,
    activeFiscalYear: {
      name: fiscalYear.name,
      startDateBS: fiscalYear.startDateBS,
      endDateBS: fiscalYear.endDateBS,
      startDateAD: fiscalYear.startDateAD,
      endDateAD: fiscalYear.endDateAD
    }
  });

  const company = await Company.findById(companyId).lean();
  await initializeAccountingForFiscalYear(company, fiscalYear);

  return mapFiscalYear(fiscalYear);
}

async function switchFiscalYear(companyId, fiscalYearId) {
  const fiscalYear = await FiscalYear.findOne({ _id: fiscalYearId, companyId });

  if (!fiscalYear) {
    throw new ApiError(404, "Fiscal year was not found.");
  }

  await FiscalYear.updateMany({ companyId, isActive: true }, { isActive: false });
  fiscalYear.isActive = true;
  await fiscalYear.save();

  await Company.findByIdAndUpdate(companyId, {
    activeFiscalYearId: fiscalYear._id,
    activeFiscalYear: {
      name: fiscalYear.name,
      startDateBS: fiscalYear.startDateBS,
      endDateBS: fiscalYear.endDateBS,
      startDateAD: fiscalYear.startDateAD,
      endDateAD: fiscalYear.endDateAD
    }
  });

  return mapFiscalYear(fiscalYear);
}

async function lockFiscalYear(companyId, fiscalYearId) {
  const fiscalYear = await FiscalYear.findOne({ _id: fiscalYearId, companyId });

  if (!fiscalYear) {
    throw new ApiError(404, "Fiscal year was not found.");
  }

  fiscalYear.isLocked = true;
  await fiscalYear.save();

  return mapFiscalYear(fiscalYear);
}

module.exports = {
  listFiscalYears,
  createFiscalYear,
  switchFiscalYear,
  lockFiscalYear,
  mapFiscalYear
};
