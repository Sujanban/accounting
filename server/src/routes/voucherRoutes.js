const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { validateVoucherDraft, validateVoucherUpdate } = require("../validators/voucherValidators");
const { createVoucherController, postVoucherController, getVoucherController, listVouchersController, updateVoucherController } = require("../controllers/voucherController");

const voucherRouter = express.Router();
voucherRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

const definitions = [
  { path: "sales", transactionType: "SALE", voucherType: "SV", label: "Sales voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "SALES"] },
  { path: "purchase", transactionType: "PURCHASE", voucherType: "PV", label: "Purchase voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER"] },
  { path: "receipt", transactionType: "RECEIPT", voucherType: "RV", label: "Receipt voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT", "SALES"] },
  { path: "payment", transactionType: "PAYMENT", voucherType: "PMV", label: "Payment voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "contra", transactionType: "CONTRA", voucherType: "CV", label: "Contra voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] },
  { path: "journal", transactionType: "JOURNAL", voucherType: "JV", label: "Journal voucher", roles: ["OWNER", "ADMIN", "ACCOUNTANT"] }
];

for (const definition of definitions) {
  voucherRouter.get(`/${definition.path}`, requireRoles(...definition.roles, "STAFF"), listVouchersController(definition));
  voucherRouter.post(`/${definition.path}`, requireRoles(...definition.roles), validate(validateVoucherDraft), createVoucherController(definition));
  voucherRouter.get(`/${definition.path}/:id`, requireRoles(...definition.roles, "STAFF"), getVoucherController(definition));
  voucherRouter.patch(`/${definition.path}/:id`, requireRoles(...definition.roles), validate(validateVoucherUpdate), updateVoucherController(definition));
  voucherRouter.post(`/${definition.path}/:id/post`, requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), postVoucherController(definition));
}

module.exports = { voucherRouter };
