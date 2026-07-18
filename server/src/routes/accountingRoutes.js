const express = require("express");

const {
  getAccountGroups,
  postAccountGroup,
  patchAccountGroup,
  archiveAccountGroupRecord,
  getChartOfAccountsTree
} = require("../controllers/accountGroupController");
const {
  getLedgers,
  postLedger,
  patchLedger,
  archiveLedgerRecord
} = require("../controllers/ledgerController");
const {
  getVoucherSequences,
  patchVoucherSequence
} = require("../controllers/voucherSequenceController");
const {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear
} = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const {
  validateAccountGroup,
  validateLedger,
  validateVoucherSequence
} = require("../validators/accountingValidators");

const accountingRouter = express.Router();

accountingRouter.use(
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireCompletedOnboarding
);

accountingRouter.get("/account-groups", getAccountGroups);
accountingRouter.post("/account-groups", validate(validateAccountGroup), postAccountGroup);
accountingRouter.patch("/account-groups/:id", patchAccountGroup);
accountingRouter.delete("/account-groups/:id", archiveAccountGroupRecord);

accountingRouter.get("/chart-of-accounts", getChartOfAccountsTree);

accountingRouter.get("/ledgers", getLedgers);
accountingRouter.post("/ledgers", validate(validateLedger), postLedger);
accountingRouter.patch("/ledgers/:id", patchLedger);
accountingRouter.delete("/ledgers/:id", archiveLedgerRecord);

accountingRouter.get("/voucher-sequences", getVoucherSequences);
accountingRouter.patch("/voucher-sequences/:id", validate(validateVoucherSequence), patchVoucherSequence);

module.exports = {
  accountingRouter
};
