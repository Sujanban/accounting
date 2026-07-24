const reportService = require("../services/reportService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
function handler(method, message) {
  return asyncHandler(async (request, response) =>
    sendSuccess(
      response,
      200,
      message,
      await reportService[method](
        request.auth.activeCompanyId,
        request.auth.activeFiscalYearId,
        request.query,
      ),
    ),
  );
}
module.exports = {
  getGeneralLedger: handler(
    "getGeneralLedger",
    "General ledger fetched successfully.",
  ),
  getTrialBalance: handler(
    "getTrialBalance",
    "Trial balance fetched successfully.",
  ),
  getJournalRegister: handler(
    "getJournalRegister",
    "Journal register fetched successfully.",
  ),
  getDayBook: handler("getDayBook", "Day book fetched successfully."),
  getStockSummary: handler(
    "getStockSummary",
    "Stock summary fetched successfully.",
  ),
  getStockLedger: handler(
    "getStockLedger",
    "Stock ledger fetched successfully.",
  ),
  getProfitLoss: handler(
    "getProfitLoss",
    "Profit and loss fetched successfully.",
  ),
  getBalanceSheet: handler(
    "getBalanceSheet",
    "Balance sheet fetched successfully.",
  ),
  getCashFlow: handler("getCashFlow", "Cash flow fetched successfully."),
  getSalesSummary: handler("getSalesSummary", "Sales summary fetched successfully."),
  getPurchaseSummary: handler("getPurchaseSummary", "Purchase summary fetched successfully."),
  getSalesByProduct: handler("getSalesByProduct", "Sales by product fetched successfully."),
  getPurchasesByProduct: handler("getPurchasesByProduct", "Purchases by product fetched successfully."),
  getExpenseSummary: handler("getExpenseSummary", "Expense summary fetched successfully."),
  getLowStock: handler("getLowStock", "Low stock report fetched successfully."),
  getNegativeStock: handler("getNegativeStock", "Negative stock report fetched successfully."),
  getExpenseTrend: handler("getExpenseTrend", "Expense trend fetched successfully."),
  getSalesTrend: handler("getSalesTrend", "Sales trend fetched successfully."),
  getCustomerStatement: handler(
    "getCustomerStatement",
    "Customer statement fetched successfully.",
  ),
  getSupplierStatement: handler(
    "getSupplierStatement",
    "Supplier statement fetched successfully.",
  ),
};
