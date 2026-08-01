const { isValidEmail } = require("../utils/email");
const { isValidBsDate } = require("../services/nepalDateService");

function rejectUnknownFields(body, allowedFields, errors) {
  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) errors.push({ field, message: "This field cannot be modified." });
  }
}

function validateCreateCompany(body) {
  const errors = [];
  rejectUnknownFields(body, new Set(["name", "panNumber", "vatRegistered", "vatNumber", "phone", "email", "address", "logo", "fiscalYear"]), errors);

  if (body.fiscalYear && typeof body.fiscalYear === "object" && !Array.isArray(body.fiscalYear)) {
    const fiscalErrors = [];
    rejectUnknownFields(body.fiscalYear, new Set(["name", "startDateBS", "endDateBS"]), fiscalErrors);
    errors.push(...fiscalErrors.map((error) => ({ ...error, field: `fiscalYear.${error.field}` })));
  }

  if (!body.name || body.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Company name must be at least 2 characters."
    });
  }

  if (!body.panNumber || body.panNumber.trim().length < 3) {
    errors.push({
      field: "panNumber",
      message: "PAN number is required."
    });
  }

  if (typeof body.vatRegistered !== "boolean") {
    errors.push({
      field: "vatRegistered",
      message: "VAT registered must be true or false."
    });
  }

  if (body.vatRegistered && (!body.vatNumber || body.vatNumber.trim().length < 3)) {
    errors.push({
      field: "vatNumber",
      message: "VAT number is required when VAT registered is true."
    });
  }

  if (body.email && !isValidEmail(body.email)) {
    errors.push({ field: "email", message: "A valid company email is required." });
  }

  if (
    !body.fiscalYear ||
    typeof body.fiscalYear !== "object" ||
    !body.fiscalYear.name ||
    !isValidBsDate(body.fiscalYear.startDateBS) ||
    !isValidBsDate(body.fiscalYear.endDateBS)
  ) {
    errors.push({
      field: "fiscalYear",
      message:
        "Fiscal-year dates must be valid Bikram Sambat dates in YYYY-MM-DD format."
    });
  }
  if (body.fiscalYear && isValidBsDate(body.fiscalYear.startDateBS) && isValidBsDate(body.fiscalYear.endDateBS) && body.fiscalYear.startDateBS > body.fiscalYear.endDateBS) {
    errors.push({ field: "fiscalYear.endDateBS", message: "Fiscal-year end date must be on or after its start date." });
  }

  return errors;
}

function validateCompanyUpdate(body) {
  const errors = [];
  rejectUnknownFields(body, new Set(["name", "phone", "email", "address", "logo"]), errors);
  if (!Object.keys(body).length) errors.push({ field: "body", message: "At least one field must be provided." });
  if (body.name !== undefined && (!body.name || body.name.trim().length < 2)) errors.push({ field: "name", message: "Company name must be at least 2 characters." });
  if (body.email !== undefined && body.email && !isValidEmail(body.email)) errors.push({ field: "email", message: "A valid company email is required." });
  return errors;
}

module.exports = {
  validateCreateCompany,
  validateCompanyUpdate
};
