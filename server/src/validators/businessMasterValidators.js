const CONTACT_ROLES = new Set(["CUSTOMER", "SUPPLIER", "EMPLOYEE", "VENDOR", "TRANSPORTER", "OTHER"]);
const mongoose = require("mongoose");
const { isValidEmail } = require("../utils/email");

const catalogFields = {
  units: new Set(["name", "symbol", "decimalAllowed"]),
  categories: new Set(["categoryCode", "name", "parentId", "description"]),
  "tax-rates": new Set(["taxCode", "name", "percentage", "type", "effectiveDate", "isDefault"]),
  "payment-terms": new Set(["name", "dueDays", "description"]),
  "contact-groups": new Set(["name", "description", "parentId"]),
  warehouses: new Set(["warehouseCode", "name", "address", "description", "isDefault"]),
  "price-lists": new Set(["name", "description", "currency", "isDefault"]),
  products: new Set(["sku", "barcode", "name", "categoryId", "unitId", "purchasePrice", "sellingPrice", "taxId", "reorderLevel", "minimumStock", "description", "isService"])
};

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

function validateCatalog(resource, body, { partial = false } = {}) {
  const errors = [];
  rejectUnknown(body, catalogFields[resource], errors);
  if (partial && !Object.keys(body).length) errors.push({ field: "body", message: "At least one field must be provided." });
  const required = (field, condition, message) => {
    if ((!partial || body[field] !== undefined) && condition) errors.push({ field, message });
  };
  const objectId = (field, message) => {
    if (body[field] !== undefined && body[field] !== null && body[field] !== "" && !mongoose.isObjectIdOrHexString(body[field])) errors.push({ field, message });
  };

  if (resource === "units") {
    required("name", !body.name || body.name.trim().length < 2, "Unit name is required.");
    required("symbol", !body.symbol || body.symbol.trim().length < 1, "Unit symbol is required.");
    if (body.decimalAllowed !== undefined && typeof body.decimalAllowed !== "boolean") errors.push({ field: "decimalAllowed", message: "Decimal allowed must be a boolean." });
  }
  if (resource === "categories") {
    required("categoryCode", !body.categoryCode || !/^[A-Za-z0-9_-]{2,30}$/.test(body.categoryCode.trim()), "Category code is invalid.");
    required("name", !body.name || body.name.trim().length < 2, "Category name is required.");
    objectId("parentId", "Parent category must be a valid identifier.");
  }
  if (resource === "tax-rates") {
    required("taxCode", !body.taxCode || !/^[A-Za-z0-9_-]{2,30}$/.test(body.taxCode.trim()), "Tax code is invalid.");
    required("name", !body.name || body.name.trim().length < 2, "Tax name is required.");
    required("percentage", !Number.isFinite(Number(body.percentage)) || Number(body.percentage) < 0 || Number(body.percentage) > 100, "Tax percentage must be between 0 and 100.");
    required("effectiveDate", !body.effectiveDate || Number.isNaN(new Date(body.effectiveDate).getTime()), "Effective date is required.");
    if (body.type !== undefined && !["VAT", "EXEMPT", "ZERO_RATED"].includes(body.type)) errors.push({ field: "type", message: "Tax type is invalid." });
    if (body.isDefault !== undefined && typeof body.isDefault !== "boolean") errors.push({ field: "isDefault", message: "Default must be a boolean." });
  }
  if (resource === "payment-terms") {
    required("name", !body.name || body.name.trim().length < 2, "Payment term name is required.");
    required("dueDays", !Number.isInteger(Number(body.dueDays)) || Number(body.dueDays) < 0 || Number(body.dueDays) > 3650, "Due days must be a whole number between 0 and 3650.");
  }
  if (resource === "contact-groups") {
    required("name", !body.name || body.name.trim().length < 2, "Contact group name is required.");
    objectId("parentId", "Parent group must be a valid identifier.");
  }
  if (resource === "warehouses") {
    required("warehouseCode", !body.warehouseCode || !/^[A-Za-z0-9_-]{2,30}$/.test(body.warehouseCode.trim()), "Warehouse code is invalid.");
    required("name", !body.name || body.name.trim().length < 2, "Warehouse name is required.");
    if (body.isDefault !== undefined && typeof body.isDefault !== "boolean") errors.push({ field: "isDefault", message: "Default must be a boolean." });
  }
  if (resource === "price-lists") {
    required("name", !body.name || body.name.trim().length < 2, "Price list name is required.");
    if (body.currency !== undefined && (!body.currency || !/^[A-Za-z]{3}$/.test(body.currency.trim()))) errors.push({ field: "currency", message: "Currency must be a 3-letter code." });
    if (body.isDefault !== undefined && typeof body.isDefault !== "boolean") errors.push({ field: "isDefault", message: "Default must be a boolean." });
  }
  if (resource === "products") {
    required("sku", !body.sku || !/^[A-Za-z0-9_-]{2,50}$/.test(body.sku.trim()), "SKU is invalid.");
    required("name", !body.name || body.name.trim().length < 2, "Product name is required.");
    required("unitId", !body.unitId, "Unit is required.");
    objectId("unitId", "Unit must be a valid identifier.");
    objectId("categoryId", "Category must be a valid identifier.");
    objectId("taxId", "Tax rate must be a valid identifier.");
    for (const field of ["purchasePrice", "sellingPrice", "reorderLevel", "minimumStock"]) if (body[field] !== undefined && (!Number.isFinite(Number(body[field])) || Number(body[field]) < 0)) errors.push({ field, message: `${field} must be non-negative.` });
    if (body.isService !== undefined && typeof body.isService !== "boolean") errors.push({ field: "isService", message: "Service status must be a boolean." });
  }
  return errors;
}

module.exports = {
  validateCreateContact: (body) => validateContact(body),
  validateUpdateContact: (body) => validateContact(body, { partial: true }),
  validateUnit: (body) => validateCatalog("units", body),
  validateCategory: (body) => validateCatalog("categories", body),
  validateTaxRate: (body) => validateCatalog("tax-rates", body),
  validatePaymentTerm: (body) => validateCatalog("payment-terms", body),
  validateContactGroup: (body) => validateCatalog("contact-groups", body),
  validateWarehouse: (body) => validateCatalog("warehouses", body),
  validatePriceList: (body) => validateCatalog("price-lists", body),
  validateAttachment: (body) => { const e = []; for (const field of ["entityType", "entityId", "fileName", "mimeType", "storageKey"]) if (!body[field]) e.push({ field, message: `${field} is required.` }); if (body.entityId && !mongoose.isObjectIdOrHexString(body.entityId)) e.push({ field: "entityId", message: "Entity ID must be a valid identifier." }); if (!Number.isInteger(Number(body.sizeBytes)) || Number(body.sizeBytes) < 0) e.push({ field: "sizeBytes", message: "File size must be a non-negative integer." }); return e; },
  validateProduct: (body) => validateCatalog("products", body),
  validateCatalogUpdate: (resource) => (body) => validateCatalog(resource, body, { partial: true })
};
