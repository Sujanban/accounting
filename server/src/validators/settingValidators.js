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

function validateSettingsUpdate(body) {
  const errors = [];
  const allowedFields = new Set(["businessType", "currency", "currencySymbol", "language", "dateFormat", "timezone", "decimalPlaces", "allowNegativeStock"]);
  for (const field of Object.keys(body)) if (!allowedFields.has(field)) errors.push({ field, message: "This field cannot be modified." });
  if (!Object.keys(body).length) errors.push({ field: "body", message: "At least one field must be provided." });
  if (body.businessType !== undefined && !BUSINESS_TYPES.has(body.businessType)) errors.push({ field: "businessType", message: "A valid business type is required." });
  if (body.currency !== undefined && (typeof body.currency !== "string" || !/^[A-Z]{3}$/.test(body.currency.trim()))) errors.push({ field: "currency", message: "Currency must be a three-letter code." });
  if (body.currencySymbol !== undefined && (typeof body.currencySymbol !== "string" || !body.currencySymbol.trim() || body.currencySymbol.trim().length > 8)) errors.push({ field: "currencySymbol", message: "Currency symbol must be 1 to 8 characters." });
  if (body.language !== undefined && !["en", "ne"].includes(body.language)) errors.push({ field: "language", message: "Language must be en or ne." });
  if (body.dateFormat !== undefined && !["BS", "AD"].includes(body.dateFormat)) errors.push({ field: "dateFormat", message: "Date format must be BS or AD." });
  if (body.timezone !== undefined && (typeof body.timezone !== "string" || body.timezone.trim().length < 3 || body.timezone.trim().length > 100)) errors.push({ field: "timezone", message: "Timezone is invalid." });
  if (body.decimalPlaces !== undefined && (!Number.isInteger(Number(body.decimalPlaces)) || Number(body.decimalPlaces) < 0 || Number(body.decimalPlaces) > 6)) errors.push({ field: "decimalPlaces", message: "Decimal places must be an integer from 0 to 6." });
  if (body.allowNegativeStock !== undefined && typeof body.allowNegativeStock !== "boolean") errors.push({ field: "allowNegativeStock", message: "Allow negative stock must be true or false." });
  return errors;
}

module.exports = {
  validateCreateSettings,
  validateSettingsUpdate
};
