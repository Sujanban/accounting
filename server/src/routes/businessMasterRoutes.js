const express = require("express");
const multer = require("multer");
const { env } = require("../config/env");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { getContacts, getContact, postContact, patchContact, archiveContactRecord, restoreContactRecord } = require("../controllers/contactController");
const { validateCreateContact, validateUpdateContact, validateUnit, validateCategory, validateTaxRate, validatePaymentTerm, validateContactGroup, validateWarehouse, validatePriceList, validateAttachment, validateProduct } = require("../validators/businessMasterValidators");
const catalogController = require("../controllers/catalogController");
const { postAttachmentUpload, getAttachments } = require("../controllers/attachmentController");

const allowedAttachmentTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.uploadMaxBytes, files: 1 }, fileFilter: (_request, file, callback) => callback(null, allowedAttachmentTypes.has(file.mimetype)) });

const businessMasterRouter = express.Router();
businessMasterRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

businessMasterRouter.get("/contacts", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), getContacts);
businessMasterRouter.get("/contacts/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), getContact);
businessMasterRouter.post("/contacts", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validateCreateContact), postContact);
businessMasterRouter.patch("/contacts/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validateUpdateContact), patchContact);
businessMasterRouter.delete("/contacts/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), archiveContactRecord);
businessMasterRouter.post("/contacts/:id/restore", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), restoreContactRecord);
businessMasterRouter.get("/units", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER", "STAFF"), catalogController.getUnits);
businessMasterRouter.post("/units", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateUnit), catalogController.postUnit);
businessMasterRouter.get("/categories", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER", "STAFF"), catalogController.getCategories);
businessMasterRouter.post("/categories", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateCategory), catalogController.postCategory);
businessMasterRouter.get("/tax-rates", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), catalogController.getTaxRates);
businessMasterRouter.post("/tax-rates", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validateTaxRate), catalogController.postTaxRate);
businessMasterRouter.get("/payment-terms", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), catalogController.getPaymentTerms);
businessMasterRouter.post("/payment-terms", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), validate(validatePaymentTerm), catalogController.postPaymentTerm);
businessMasterRouter.get("/contact-groups", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), catalogController.getContactGroups);
businessMasterRouter.post("/contact-groups", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validateContactGroup), catalogController.postContactGroup);
businessMasterRouter.get("/warehouses", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER", "STAFF"), catalogController.getWarehouses);
businessMasterRouter.post("/warehouses", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateWarehouse), catalogController.postWarehouse);
businessMasterRouter.get("/price-lists", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), catalogController.getPriceLists);
businessMasterRouter.post("/price-lists", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validatePriceList), catalogController.postPriceList);
businessMasterRouter.get("/attachments", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), getAttachments);
businessMasterRouter.post("/attachments", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), upload.single("file"), postAttachmentUpload);
businessMasterRouter.get("/products", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "INVENTORY_MANAGER", "STAFF"), catalogController.getProducts);
businessMasterRouter.post("/products", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateProduct), catalogController.postProduct);

module.exports = { businessMasterRouter };
