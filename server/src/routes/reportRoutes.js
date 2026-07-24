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
module.exports = { reportRouter };
