const CONTACT_ROLES = new Set(["CUSTOMER", "SUPPLIER", "EMPLOYEE", "VENDOR", "TRANSPORTER", "OTHER"]);
const mongoose = require("mongoose");
const { isValidEmail } = require("../utils/email");

function rejectUnknown(body, fields, errors) {
  for (const key of Object.keys(body)) if (!fields.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
}

const contactFields = new Set([
  "contactCode", "name", "displayName", "roles", "contactGroupId", "panNumber", "vatNumber", "phone", "mobile", "email", "website", "billingAddress", "shippingAddress", "creditLimit", "paymentTermId", "notes"
]);

function validateContact(body, { partial = false } = {}) {
  const errors = [];
  rejectUnknown(body, contactFields, errors);
  if (!partial && (!body.contactCode || body.contactCode.trim().length < 2)) errors.push({ field: "contactCode", message: "Contact code is required." });
  if (!partial && (!body.name || body.name.trim().length < 2)) errors.push({ field: "name", message: "Contact name is required." });
  if (partial && !Object.keys(body).length) errors.push({ field: "body", message: "At least one field must be provided." });
  if (partial && body.contactCode !== undefined) errors.push({ field: "contactCode", message: "Contact code cannot be modified." });
  if (body.name !== undefined && (!body.name || body.name.trim().length < 2)) errors.push({ field: "name", message: "Contact name must be at least 2 characters." });
  if (body.roles !== undefined && (!Array.isArray(body.roles) || !body.roles.length || body.roles.some((role) => !CONTACT_ROLES.has(role)))) errors.push({ field: "roles", message: "At least one valid contact role is required." });
  if (!partial && body.roles === undefined) errors.push({ field: "roles", message: "At least one valid contact role is required." });
  if (body.contactGroupId !== undefined && body.contactGroupId !== null && body.contactGroupId !== "" && !mongoose.isObjectIdOrHexString(body.contactGroupId)) errors.push({ field: "contactGroupId", message: "Contact group ID must be a valid identifier." });
  if (body.email !== undefined && body.email && !isValidEmail(body.email)) errors.push({ field: "email", message: "Enter a valid email address." });
  if (body.panNumber !== undefined && body.panNumber && !/^\d{9}$/.test(body.panNumber.trim())) errors.push({ field: "panNumber", message: "PAN number must contain 9 digits." });
  if (body.vatNumber !== undefined && body.vatNumber && !/^\d{9}$/.test(body.vatNumber.trim())) errors.push({ field: "vatNumber", message: "VAT number must contain 9 digits." });
  if (body.creditLimit !== undefined && (!Number.isFinite(Number(body.creditLimit)) || Number(body.creditLimit) < 0)) errors.push({ field: "creditLimit", message: "Credit limit must be a non-negative number." });
  if (body.website !== undefined && body.website) {
    try { new URL(body.website); } catch (_error) { errors.push({ field: "website", message: "Enter a valid website URL." }); }
  }
  return errors;
}

module.exports = {
  validateCreateContact: (body) => validateContact(body),
  validateUpdateContact: (body) => validateContact(body, { partial: true }),
  validateUnit: (body) => { const e = []; if (!body.name || body.name.trim().length < 2) e.push({ field: "name", message: "Unit name is required." }); if (!body.symbol || body.symbol.trim().length < 1) e.push({ field: "symbol", message: "Unit symbol is required." }); return e; },
  validateCategory: (body) => { const e = []; if (!body.categoryCode || !/^[A-Za-z0-9_-]{2,30}$/.test(body.categoryCode.trim())) e.push({ field: "categoryCode", message: "Category code is invalid." }); if (!body.name || body.name.trim().length < 2) e.push({ field: "name", message: "Category name is required." }); return e; },
  validateTaxRate: (body) => { const e = []; if (!body.taxCode || !/^[A-Za-z0-9_-]{2,30}$/.test(body.taxCode.trim())) e.push({ field: "taxCode", message: "Tax code is invalid." }); if (!body.name || body.name.trim().length < 2) e.push({ field: "name", message: "Tax name is required." }); if (!Number.isFinite(Number(body.percentage)) || Number(body.percentage) < 0 || Number(body.percentage) > 100) e.push({ field: "percentage", message: "Tax percentage must be between 0 and 100." }); if (!body.effectiveDate || Number.isNaN(new Date(body.effectiveDate).getTime())) e.push({ field: "effectiveDate", message: "Effective date is required." }); return e; },
  validatePaymentTerm: (body) => { const e = []; if (!body.name || body.name.trim().length < 2) e.push({ field: "name", message: "Payment term name is required." }); if (!Number.isInteger(Number(body.dueDays)) || Number(body.dueDays) < 0) e.push({ field: "dueDays", message: "Due days must be a non-negative integer." }); return e; },
  validateProduct: (body) => { const e = []; if (!body.sku || !/^[A-Za-z0-9_-]{2,50}$/.test(body.sku.trim())) e.push({ field: "sku", message: "SKU is invalid." }); if (!body.name || body.name.trim().length < 2) e.push({ field: "name", message: "Product name is required." }); if (!body.unitId) e.push({ field: "unitId", message: "Unit is required." }); for (const field of ["purchasePrice", "sellingPrice", "reorderLevel", "minimumStock"]) if (body[field] !== undefined && (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0)) e.push({ field, message: `${field} must be non-negative.` }); return e; }
};
