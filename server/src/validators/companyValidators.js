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

  if (body.email && !/^\S+@\S+\.\S+$/.test(body.email)) {
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

module.exports = {
  validateCreateCompany
};
