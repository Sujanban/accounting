const { AccountGroup } = require("../models/AccountGroup");
const { FiscalYear } = require("../models/FiscalYear");
const { Ledger } = require("../models/Ledger");
const { VoucherSequence } = require("../models/VoucherSequence");

const DEFAULT_ACCOUNT_GROUPS = [
  { category: "Assets", name: "Current Assets" },
  { category: "Assets", name: "Fixed Assets" },
  { category: "Assets", name: "Investments" },
  { category: "Liabilities", name: "Current Liabilities" },
  { category: "Liabilities", name: "Long-term Liabilities" },
  { category: "Equity", name: "Capital Account" },
  { category: "Equity", name: "Retained Earnings" },
  { category: "Income", name: "Direct Income" },
  { category: "Income", name: "Indirect Income" },
  { category: "Expenses", name: "Direct Expenses" },
  { category: "Expenses", name: "Indirect Expenses" }
];

const DEFAULT_LEDGERS = [
  { name: "Cash in Hand", accountGroup: "Current Assets" },
  { name: "Bank Account", accountGroup: "Current Assets" },
  { name: "Inventory", accountGroup: "Current Assets" },
  { name: "Accounts Receivable", accountGroup: "Current Assets" },
  { name: "Accounts Payable", accountGroup: "Current Liabilities" },
  { name: "Capital", accountGroup: "Capital Account" },
  { name: "Sales", accountGroup: "Direct Income" },
  { name: "Purchase", accountGroup: "Direct Expenses" },
  { name: "Salary Expense", accountGroup: "Indirect Expenses" },
  { name: "Rent Expense", accountGroup: "Indirect Expenses" },
  { name: "Electricity Expense", accountGroup: "Indirect Expenses" },
  { name: "Internet Expense", accountGroup: "Indirect Expenses" },
  { name: "Miscellaneous Expense", accountGroup: "Indirect Expenses" }
];

const DEFAULT_VOUCHER_SEQUENCES = ["JV", "SV", "PV", "RV", "PMV", "CV"];

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

  await AccountGroup.insertMany(
    DEFAULT_ACCOUNT_GROUPS.map((group) => ({
      companyId: company._id,
      name: group.name,
      category: group.category,
      isSystem: true,
      isActive: true
    }))
  );

  await Ledger.insertMany(
    DEFAULT_LEDGERS.map((ledger) => ({
      companyId: company._id,
      fiscalYearId: fiscalYear._id,
      name: ledger.name,
      accountGroup: ledger.accountGroup,
      openingBalance: 0,
      openingBalanceType: "DEBIT",
      isSystem: true,
      isActive: true,
      sourceType: "SYSTEM"
    }))
  );

  await VoucherSequence.insertMany(
    DEFAULT_VOUCHER_SEQUENCES.map((type) => ({
      companyId: company._id,
      type,
      currentNumber: 0
    }))
  );

  return fiscalYear;
}

module.exports = {
  bootstrapAccountingForCompany
};
