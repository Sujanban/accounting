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

async function initializeAccountingForCompany(company, fiscalYear, userId = null) {
  await AccountGroup.insertMany(
    DEFAULT_ACCOUNT_GROUPS.map((group) => ({
      companyId: company._id,
      name: group.name,
      systemCode: group.systemCode,
      category: group.category,
      isSystem: true,
      isActive: true,
      createdBy: userId,
      updatedBy: userId
    }))
  );

  await Ledger.insertMany(
    DEFAULT_LEDGERS.map((ledger) => ({
      companyId: company._id,
      fiscalYearId: fiscalYear._id,
      name: ledger.name,
      systemCode: ledger.systemCode,
      accountGroup: ACCOUNT_GROUP_NAME_BY_CODE[ledger.accountGroupCode],
      openingBalance: 0,
      openingBalanceType: "DEBIT",
      isSystem: true,
      isActive: true,
      sourceType: "SYSTEM",
      createdBy: userId,
      updatedBy: userId
    }))
  );

  await VoucherSequence.insertMany(
    DEFAULT_VOUCHER_SEQUENCES.map((type) => ({
      companyId: company._id,
      type,
      currentNumber: 0,
      createdBy: userId,
      updatedBy: userId
    }))
  );
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
  initializeAccountingForCompany
};
