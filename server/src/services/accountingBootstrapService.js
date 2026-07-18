const { AccountGroup } = require("../models/AccountGroup");
const { FiscalYear } = require("../models/FiscalYear");
const { Ledger } = require("../models/Ledger");
const { VoucherSequence } = require("../models/VoucherSequence");
const {
  DEFAULT_ACCOUNT_GROUPS,
  DEFAULT_LEDGERS,
  DEFAULT_VOUCHER_SEQUENCES,
  ACCOUNT_GROUP_NAME_BY_CODE
} = require("../shared/constants/accounting");

function buildVoucherPrefix(voucherType, fiscalYear) {
  return `${voucherType}-${fiscalYear.name}-`;
}

async function initializeAccountGroups(company, userId = null) {
  return AccountGroup.insertMany(
    DEFAULT_ACCOUNT_GROUPS.map((group) => ({
      companyId: company._id,
      name: group.name,
      systemCode: group.systemCode,
      category: group.category,
      type: group.category,
      isSystem: true,
      isActive: true,
      createdBy: userId,
      updatedBy: userId
    }))
  );
}

async function initializeSystemLedgers(company, fiscalYear, groups, userId = null) {
  const groupIdByCode = groups.reduce((accumulator, group) => {
    accumulator[group.systemCode] = group._id;
    return accumulator;
  }, {});

  return Ledger.insertMany(
    DEFAULT_LEDGERS.map((ledger) => ({
      companyId: company._id,
      fiscalYearId: fiscalYear._id,
      groupId: groupIdByCode[ledger.accountGroupCode],
      name: ledger.name,
      systemCode: ledger.systemCode,
      accountGroup: ACCOUNT_GROUP_NAME_BY_CODE[ledger.accountGroupCode],
      openingBalance: 0,
      openingBalanceType: "DEBIT",
      allowManualEntry: false,
      isSystem: true,
      isActive: true,
      sourceType: "SYSTEM",
      createdBy: userId,
      updatedBy: userId
    }))
  );
}

async function initializeVoucherSequencesForFiscalYear(company, fiscalYear, userId = null) {
  return VoucherSequence.insertMany(
    DEFAULT_VOUCHER_SEQUENCES.map((voucherType) => ({
      companyId: company._id,
      fiscalYearId: fiscalYear._id,
      voucherType,
      prefix: buildVoucherPrefix(voucherType, fiscalYear),
      nextNumber: 1,
      padding: 6,
      resetEveryFiscalYear: true,
      createdBy: userId,
      updatedBy: userId
    }))
  );
}

async function initializeAccountingForCompany(company, fiscalYear, userId = null) {
  const groups = await initializeAccountGroups(company, userId);
  await initializeSystemLedgers(company, fiscalYear, groups, userId);
  await initializeVoucherSequencesForFiscalYear(company, fiscalYear, userId);
}

async function initializeAccountingForFiscalYear(company, fiscalYear, userId = null) {
  const groups = await AccountGroup.find({
    companyId: company._id,
    isActive: true
  }).lean();

  await initializeSystemLedgers(company, fiscalYear, groups, userId);
  await initializeVoucherSequencesForFiscalYear(company, fiscalYear, userId);
}

async function bootstrapAccountingForCompany(company) {
  const fiscalYear = await FiscalYear.create({
    companyId: company._id,
    name: company.activeFiscalYear.name,
    startDateBS: company.activeFiscalYear.startDateBS,
    endDateBS: company.activeFiscalYear.endDateBS,
    startDateAD: company.activeFiscalYear.startDateAD || null,
    endDateAD: company.activeFiscalYear.endDateAD || null,
    isActive: true
  });

  await initializeAccountingForCompany(company, fiscalYear, null);

  return fiscalYear;
}

module.exports = {
  bootstrapAccountingForCompany,
  initializeAccountingForCompany,
  initializeAccountingForFiscalYear,
  initializeVoucherSequencesForFiscalYear,
  buildVoucherPrefix
};
