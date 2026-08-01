const { bsToUtcDate, dateToBs } = require("../services/nepalDateService");

const BUSINESS_DATE_FIELDS = new Set([
  "attendanceDate",
  "effectiveDate",
  "endDate",
  "from",
  "fromDate",
  "fulfillmentDate",
  "issuedAt",
  "lockBeforeDate",
  "orderDate",
  "purchaseDate",
  "registrationDate",
  "startDate",
  "transactionDate",
  "to",
  "toDate",
]);

function normalizeBusinessDates(value) {
  if (!value || typeof value !== "object") return value;
  for (const [field, fieldValue] of Object.entries(value)) {
    if (fieldValue === null || fieldValue === undefined || fieldValue === "") continue;
    if (BUSINESS_DATE_FIELDS.has(field)) {
      value[field] = bsToUtcDate(fieldValue);
    } else if (typeof fieldValue === "object") {
      normalizeBusinessDates(fieldValue);
    }
  }
  return value;
}

function serializeBusinessDates(value, fieldName) {
  if (value === null || value === undefined) return value;
  if (fieldName && BUSINESS_DATE_FIELDS.has(fieldName)) return dateToBs(value);
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => serializeBusinessDates(item));
  if (typeof value !== "object") return value;

  const source = typeof value.toObject === "function" ? value.toObject() : value;
  const prototype = Object.getPrototypeOf(source);
  if (prototype !== Object.prototype && prototype !== null) return source;
  return Object.fromEntries(
    Object.entries(source).map(([field, fieldValue]) => [field, serializeBusinessDates(fieldValue, field)]),
  );
}

module.exports = { BUSINESS_DATE_FIELDS, normalizeBusinessDates, serializeBusinessDates };
