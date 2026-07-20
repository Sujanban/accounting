const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { getContacts, postContact, patchContact, archiveContactRecord } = require("../controllers/contactController");
const { validateCreateContact, validateUpdateContact } = require("../validators/businessMasterValidators");

const businessMasterRouter = express.Router();
businessMasterRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

businessMasterRouter.get("/contacts", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), getContacts);
businessMasterRouter.post("/contacts", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validateCreateContact), postContact);
businessMasterRouter.patch("/contacts/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES"), validate(validateUpdateContact), patchContact);
businessMasterRouter.delete("/contacts/:id", requireRoles("OWNER", "ADMIN", "ACCOUNTANT"), archiveContactRecord);

module.exports = { businessMasterRouter };
