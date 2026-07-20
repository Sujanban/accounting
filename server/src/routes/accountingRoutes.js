const express = require("express");

const {
  getAccountGroups,
  postAccountGroup,
  patchAccountGroup,
  archiveAccountGroupRecord,
  restoreAccountGroupRecord,
  getChartOfAccountsTree
} = require("../controllers/accountGroupController");
const {
  getLedgers,
  postLedger,
  patchLedger,
  archiveLedgerRecord,
  restoreLedgerRecord
} = require("../controllers/ledgerController");
const {
  getVoucherSequences,
  patchVoucherSequence
} = require("../controllers/voucherSequenceController");
const {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireRoles
} = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const {
  validateAccountGroup,
  validateAccountGroupUpdate,
  validateLedger,
  validateLedgerUpdate,
  validateVoucherSequence
} = require("../validators/accountingValidators");

const accountingRouter = express.Router();

accountingRouter.use(
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireCompletedOnboarding
);

accountingRouter.get("/account-groups", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), getAccountGroups);
accountingRouter.post("/account-groups", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validateAccountGroup), postAccountGroup);
accountingRouter.patch("/account-groups/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validateAccountGroupUpdate), patchAccountGroup);
accountingRouter.patch("/account-groups/:id/restore", requireRoles("OWNER", "ADMIN"), restoreAccountGroupRecord);
accountingRouter.delete("/account-groups/:id", requireRoles("OWNER", "ADMIN"), archiveAccountGroupRecord);

accountingRouter.get("/chart-of-accounts", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), getChartOfAccountsTree);

accountingRouter.get("/ledgers", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), getLedgers);
accountingRouter.post("/ledgers", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validateLedger), postLedger);
accountingRouter.patch("/ledgers/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validateLedgerUpdate), patchLedger);
accountingRouter.patch("/ledgers/:id/restore", requireRoles("OWNER", "ADMIN"), restoreLedgerRecord);
accountingRouter.delete("/ledgers/:id", requireRoles("OWNER", "ADMIN"), archiveLedgerRecord);

accountingRouter.get("/voucher-sequences", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), getVoucherSequences);
accountingRouter.patch("/voucher-sequences/:id", requireRoles("OWNER", "ADMIN"), validate(validateVoucherSequence), patchVoucherSequence);

module.exports = {
  accountingRouter
};
