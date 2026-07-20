const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { getContacts, postContact, patchContact, archiveContactRecord } = require("../controllers/contactController");
const { validateCreateContact, validateUpdateContact, validateUnit, validateCategory, validateTaxRate, validatePaymentTerm, validateProduct } = require("../validators/businessMasterValidators");
const catalogController = require("../controllers/catalogController");

const businessMasterRouter = express.Router();
businessMasterRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

businessMasterRouter.get("/contacts", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), getContacts);
businessMasterRouter.post("/contacts", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validateCreateContact), postContact);
businessMasterRouter.patch("/contacts/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validateUpdateContact), patchContact);
businessMasterRouter.delete("/contacts/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), archiveContactRecord);
businessMasterRouter.get("/units", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER", "STAFF"), catalogController.getUnits);
businessMasterRouter.post("/units", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateUnit), catalogController.postUnit);
businessMasterRouter.get("/categories", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER", "STAFF"), catalogController.getCategories);
businessMasterRouter.post("/categories", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateCategory), catalogController.postCategory);
businessMasterRouter.get("/tax-rates", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), catalogController.getTaxRates);
businessMasterRouter.post("/tax-rates", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validateTaxRate), catalogController.postTaxRate);
businessMasterRouter.get("/payment-terms", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), catalogController.getPaymentTerms);
businessMasterRouter.post("/payment-terms", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validatePaymentTerm), catalogController.postPaymentTerm);
businessMasterRouter.get("/products", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "INVENTORY_MANAGER", "STAFF"), catalogController.getProducts);
businessMasterRouter.post("/products", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateProduct), catalogController.postProduct);

module.exports = { businessMasterRouter };
