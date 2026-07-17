const BUSINESS_TYPES = new Set([
  "RETAIL",
  "WHOLESALE",
  "SERVICE",
  "MANUFACTURING",
  "PHARMACY",
  "RESTAURANT",
  "OTHER"
]);

function validateCreateSettings(body) {
  const errors = [];

  if (!BUSINESS_TYPES.has(body.businessType)) {
    errors.push({
      field: "businessType",
      message: "A valid business type is required."
    });
  }

  if (
    body.dateFormat !== undefined &&
    !["BS", "AD"].includes(body.dateFormat)
  ) {
    errors.push({
      field: "dateFormat",
      message: "Date format must be BS or AD."
    });
  }

  if (
    body.decimalPlaces !== undefined &&
    (!Number.isInteger(body.decimalPlaces) ||
      body.decimalPlaces < 0 ||
      body.decimalPlaces > 6)
  ) {
    errors.push({
      field: "decimalPlaces",
      message: "Decimal places must be an integer from 0 to 6."
    });
  }

  if (
    body.allowNegativeStock !== undefined &&
    typeof body.allowNegativeStock !== "boolean"
  ) {
    errors.push({
      field: "allowNegativeStock",
      message: "Allow negative stock must be true or false."
    });
  }

  return errors;
}

module.exports = {
  validateCreateSettings
};
