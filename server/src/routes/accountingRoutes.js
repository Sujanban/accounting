const express = require("express");

const { getAccountingOverview } = require("../controllers/accountingController");
const {
  getFiscalYears,
  postFiscalYear,
  activateFiscalYear,
  postLockFiscalYear
} = require("../controllers/fiscalYearController");
const {
  getAccountGroups,
  getLedgers,
  postLedger,
  patchLedger,
  archiveLedgerRecord,
  getGeneralLedgerReport,
  getTrialBalanceReport
} = require("../controllers/ledgerController");
const {
  getCustomers,
  postCustomer,
  patchCustomer,
  archiveCustomer,
  getSuppliers,
  postSupplier,
  patchSupplier,
  archiveSupplier
} = require("../controllers/partyController");
const {
  getProducts,
  postProduct,
  patchProduct,
  archiveProductRecord
} = require("../controllers/productController");
const { getJournalEntries, postJournalEntry } = require("../controllers/journalController");
const {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear
} = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const {
  validateFiscalYear,
  validateLedger,
  validateParty,
  validateProduct,
  validateJournalEntry
} = require("../validators/accountingValidators");

const accountingRouter = express.Router();

accountingRouter.use(
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireCompletedOnboarding
);

accountingRouter.get("/dashboard", getAccountingOverview);

accountingRouter.get("/fiscal-years", getFiscalYears);
accountingRouter.post("/fiscal-years", validate(validateFiscalYear), postFiscalYear);
accountingRouter.post("/fiscal-years/:fiscalYearId/switch", activateFiscalYear);
accountingRouter.post("/fiscal-years/:fiscalYearId/lock", postLockFiscalYear);

accountingRouter.get("/account-groups", getAccountGroups);

accountingRouter.get("/ledgers", getLedgers);
accountingRouter.post("/ledgers", validate(validateLedger), postLedger);
accountingRouter.patch("/ledgers/:ledgerId", patchLedger);
accountingRouter.post("/ledgers/:ledgerId/archive", archiveLedgerRecord);
accountingRouter.get("/ledgers/:ledgerId/general-ledger", getGeneralLedgerReport);

accountingRouter.get("/trial-balance", getTrialBalanceReport);

accountingRouter.get("/customers", getCustomers);
accountingRouter.post("/customers", validate(validateParty), postCustomer);
accountingRouter.patch("/customers/:customerId", patchCustomer);
accountingRouter.post("/customers/:customerId/archive", archiveCustomer);

accountingRouter.get("/suppliers", getSuppliers);
accountingRouter.post("/suppliers", validate(validateParty), postSupplier);
accountingRouter.patch("/suppliers/:supplierId", patchSupplier);
accountingRouter.post("/suppliers/:supplierId/archive", archiveSupplier);

accountingRouter.get("/products", getProducts);
accountingRouter.post("/products", validate(validateProduct), postProduct);
accountingRouter.patch("/products/:productId", patchProduct);
accountingRouter.post("/products/:productId/archive", archiveProductRecord);

accountingRouter.get("/journal-entries", getJournalEntries);
accountingRouter.post("/journal-entries", validate(validateJournalEntry), postJournalEntry);

module.exports = {
  accountingRouter
};
