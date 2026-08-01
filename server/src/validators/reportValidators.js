const mongoose = require("mongoose");
const { isValidBsDate } = require("../services/nepalDateService");

const ALLOWED_FILTERS = new Set(["from", "to", "page", "limit", "branchId"]);
const GENERAL_LEDGER_FILTERS = new Set([...ALLOWED_FILTERS, "ledgerId"]);
const STOCK_SUMMARY_FILTERS = new Set([...ALLOWED_FILTERS, "warehouseId"]);
const STOCK_LEDGER_FILTERS = new Set([...ALLOWED_FILTERS, "productId", "warehouseId"]);
const CONTACT_STATEMENT_FILTERS = new Set([...ALLOWED_FILTERS, "contactId"]);

const isDate = isValidBsDate;

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
      message: "Enter a valid Bikram Sambat date in YYYY-MM-DD format.",
    });
  if (query.to !== undefined && !isDate(query.to))
    errors.push({
      field: "to",
      message: "Enter a valid Bikram Sambat date in YYYY-MM-DD format.",
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
  if (query.branchId !== undefined && !mongoose.isObjectIdOrHexString(query.branchId)) errors.push({ field: "branchId", message: "Branch must be a valid identifier." });

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

function validateStockSummaryQuery(query) {
  const errors = validateReportQuery(query, STOCK_SUMMARY_FILTERS);
  if (
    query.warehouseId !== undefined &&
    !mongoose.isObjectIdOrHexString(query.warehouseId)
  ) {
    errors.push({
      field: "warehouseId",
      message: "Warehouse must be a valid identifier.",
    });
  }
  return errors;
}

function validateStockLedgerQuery(query) {
  const errors = validateReportQuery(query, STOCK_LEDGER_FILTERS);
  if (!mongoose.isObjectIdOrHexString(query.productId)) errors.push({ field: "productId", message: "Product must be a valid identifier." });
  if (query.warehouseId !== undefined && !mongoose.isObjectIdOrHexString(query.warehouseId)) errors.push({ field: "warehouseId", message: "Warehouse must be a valid identifier." });
  return errors;
}

function validateContactStatementQuery(query) {
  const errors = validateReportQuery(query, CONTACT_STATEMENT_FILTERS);
  if (!mongoose.isObjectIdOrHexString(query.contactId)) {
    errors.push({ field: "contactId", message: "Contact must be a valid identifier." });
  }
  return errors;
}

module.exports = {
  validateGeneralLedgerQuery,
  validateListReportQuery,
  validateStockSummaryQuery,
  validateStockLedgerQuery,
  validateContactStatementQuery,
};
