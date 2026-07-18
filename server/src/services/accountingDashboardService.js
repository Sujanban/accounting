const { Customer } = require("../models/Customer");
const { Ledger } = require("../models/Ledger");
const { Product } = require("../models/Product");
const { Supplier } = require("../models/Supplier");
const { LEDGERS } = require("../shared/constants/accounting");
const { getTrialBalance } = require("./ledgerService");

async function getAccountingDashboard(companyId, fiscalYearId) {
  const [trialBalance, customerCount, supplierCount, productCount, ledgers] =
    await Promise.all([
      getTrialBalance(companyId, fiscalYearId),
      Customer.countDocuments({ companyId, fiscalYearId, isActive: true }),
      Supplier.countDocuments({ companyId, fiscalYearId, isActive: true }),
      Product.countDocuments({ companyId, fiscalYearId, isActive: true }),
      Ledger.find({ companyId, fiscalYearId, isActive: true }).lean()
    ]);

  function getLedgerBalance(systemCode) {
    const ledger = ledgers.find((item) => item.systemCode === systemCode);
    const trialBalanceRow = trialBalance.rows.find(
      (row) => String(row.ledgerId) === String(ledger ? ledger._id : "")
    );

    if (!ledger || !trialBalanceRow) {
      return 0;
    }

    return trialBalanceRow.debit || trialBalanceRow.credit;
  }

  return {
    activeFiscalYearId: fiscalYearId,
    cashBalance: getLedgerBalance(LEDGERS.CASH.systemCode),
    bankBalance: getLedgerBalance(LEDGERS.BANK.systemCode),
    totalReceivable: getLedgerBalance(LEDGERS.ACCOUNTS_RECEIVABLE.systemCode),
    totalPayable: getLedgerBalance(LEDGERS.ACCOUNTS_PAYABLE.systemCode),
    customerCount,
    supplierCount,
    productCount,
    trialBalanceStatus: trialBalance.isBalanced ? "BALANCED" : "ERROR"
  };
}

module.exports = {
  getAccountingDashboard
};
