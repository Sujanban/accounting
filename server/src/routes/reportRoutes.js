const express = require("express");
const {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireRoles,
} = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validateQuery } = require("../middleware/validate");
const {
  validateGeneralLedgerQuery,
  validateListReportQuery,
  validateStockSummaryQuery,
  validateStockLedgerQuery,
  validateContactStatementQuery,
} = require("../validators/reportValidators");
const controller = require("../controllers/reportController");
const reportRouter = express.Router();
reportRouter.use(
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireCompletedOnboarding,
  requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"),
);
reportRouter.get(
  "/general-ledger",
  validateQuery(validateGeneralLedgerQuery),
  controller.getGeneralLedger,
);
reportRouter.get(
  "/trial-balance",
  validateQuery(validateListReportQuery),
  controller.getTrialBalance,
);
reportRouter.get(
  "/journal-register",
  validateQuery(validateListReportQuery),
  controller.getJournalRegister,
);
reportRouter.get(
  "/day-book",
  validateQuery(validateListReportQuery),
  controller.getDayBook,
);
reportRouter.get(
  "/stock-summary",
  validateQuery(validateStockSummaryQuery),
  controller.getStockSummary,
);
reportRouter.get(
  "/stock-ledger",
  validateQuery(validateStockLedgerQuery),
  controller.getStockLedger,
);
reportRouter.get(
  "/profit-loss",
  validateQuery(validateListReportQuery),
  controller.getProfitLoss,
);
reportRouter.get(
  "/balance-sheet",
  validateQuery(validateListReportQuery),
  controller.getBalanceSheet,
);
reportRouter.get(
  "/cash-flow",
  validateQuery(validateListReportQuery),
  controller.getCashFlow,
);
reportRouter.get("/sales-summary", validateQuery(validateListReportQuery), controller.getSalesSummary);
reportRouter.get("/purchase-summary", validateQuery(validateListReportQuery), controller.getPurchaseSummary);
reportRouter.get("/sales-by-product", validateQuery(validateListReportQuery), controller.getSalesByProduct);
reportRouter.get("/purchases-by-product", validateQuery(validateListReportQuery), controller.getPurchasesByProduct);
reportRouter.get("/expense-summary", validateQuery(validateListReportQuery), controller.getExpenseSummary);
reportRouter.get("/low-stock", validateQuery(validateListReportQuery), controller.getLowStock);
reportRouter.get("/negative-stock", validateQuery(validateListReportQuery), controller.getNegativeStock);
reportRouter.get("/expense-trend", validateQuery(validateListReportQuery), controller.getExpenseTrend);
reportRouter.get(
  "/customer-statement",
  validateQuery(validateContactStatementQuery),
  controller.getCustomerStatement,
);
reportRouter.get(
  "/supplier-statement",
  validateQuery(validateContactStatementQuery),
  controller.getSupplierStatement,
);
module.exports = { reportRouter };
