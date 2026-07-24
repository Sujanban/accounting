const mongoose = require("mongoose");

const ALLOWED_FILTERS = new Set(["from", "to", "page", "limit"]);
const GENERAL_LEDGER_FILTERS = new Set([...ALLOWED_FILTERS, "ledgerId"]);

const isDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));

const isPositiveInteger = (value) =>
  typeof value === "string" && /^(?:[1-9]\d*)$/.test(value);

function validateReportQuery(query, allowedFilters) {
  const errors = [];

  for (const field of Object.keys(query)) {
    if (!allowedFilters.has(field))
      errors.push({ field, message: "This filter is not supported." });
  }

  if (query.from !== undefined && !isDate(query.from))
    errors.push({
      field: "from",
      message: "Enter a valid date in YYYY-MM-DD format.",
    });
  if (query.to !== undefined && !isDate(query.to))
    errors.push({
      field: "to",
      message: "Enter a valid date in YYYY-MM-DD format.",
    });
  if (isDate(query.from) && isDate(query.to) && query.from > query.to)
    errors.push({
      field: "to",
      message: "The end date must be on or after the start date.",
    });
  if (query.page !== undefined && !isPositiveInteger(query.page))
    errors.push({ field: "page", message: "Page must be a positive integer." });
  if (
    query.limit !== undefined &&
    (!isPositiveInteger(query.limit) || Number(query.limit) > 100)
  )
    errors.push({
      field: "limit",
      message: "Limit must be a positive integer no greater than 100.",
    });

  return errors;
}

function validateGeneralLedgerQuery(query) {
  const errors = validateReportQuery(query, GENERAL_LEDGER_FILTERS);
  if (!mongoose.isObjectIdOrHexString(query.ledgerId))
    errors.push({
      field: "ledgerId",
      message: "Ledger must be a valid identifier.",
    });
  return errors;
}

function validateListReportQuery(query) {
  return validateReportQuery(query, ALLOWED_FILTERS);
}

module.exports = { validateGeneralLedgerQuery, validateListReportQuery };
