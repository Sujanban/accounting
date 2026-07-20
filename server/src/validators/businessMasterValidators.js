const CONTACT_ROLES = new Set(["CUSTOMER", "SUPPLIER", "EMPLOYEE", "VENDOR", "TRANSPORTER", "OTHER"]);

function rejectUnknown(body, fields, errors) {
  for (const key of Object.keys(body)) if (!fields.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
  validateUpdateContact: (body) => validateContact(body, { partial: true })
};
