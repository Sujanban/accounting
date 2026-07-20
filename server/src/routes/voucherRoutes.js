const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { validateVoucherDraft } = require("../validators/voucherValidators");
const { createVoucherController, postVoucherController } = require("../controllers/voucherController");

const voucherRouter = express.Router();
voucherRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

const definitions = [
  { path: "sales", transactionType: "SALE", voucherType: "SV", label: "Sales voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "SALES"] },
  { path: "purchase", transactionType: "PURCHASE", voucherType: "PV", label: "Purchase voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER"] },
  { path: "receipt", transactionType: "RECEIPT", voucherType: "RV", label: "Receipt voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "SALES"] },
  { path: "payment", transactionType: "PAYMENT", voucherType: "PMV", label: "Payment voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "contra", transactionType: "CONTRA", voucherType: "CV", label: "Contra voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "journal", transactionType: "JOURNAL", voucherType: "JV", label: "Journal voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "expense", transactionType: "EXPENSE", voucherType: "PMV", label: "Expense voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "sales-return", transactionType: "SALES_RETURN", voucherType: "SV", label: "Sales return voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "SALES"] },
  { path: "purchase-return", transactionType: "PURCHASE_RETURN", voucherType: "PV", label: "Purchase return voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER"] },
  { path: "debit-note", transactionType: "DEBIT_NOTE", voucherType: "JV", label: "Debit note", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "credit-note", transactionType: "CREDIT_NOTE", voucherType: "JV", label: "Credit note", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "opening-balance", transactionType: "OPENING_BALANCE", voucherType: "JV", label: "Opening balance voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] }
];

for (const definition of definitions) {
  voucherRouter.post(`/${definition.path}`, requireRoles(...definition.roles), validate(validateVoucherDraft), createVoucherController(definition));
  voucherRouter.post(`/${definition.path}/:id/post`, requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), postVoucherController(definition));
}

module.exports = { voucherRouter };
