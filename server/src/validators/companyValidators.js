const { isValidEmail } = require("../utils/email");

function rejectUnknownFields(body, allowedFields, errors) {
  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) errors.push({ field, message: "This field cannot be modified." });
  }
}

function validateCreateCompany(body) {
  const errors = [];

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
    !body.fiscalYear.startDateBS ||
    !body.fiscalYear.endDateBS ||
    !body.fiscalYear.startDateAD ||
    !body.fiscalYear.endDateAD
  ) {
    errors.push({
      field: "fiscalYear",
      message:
        "Fiscal year name, BS dates, and AD dates are required."
    });
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
