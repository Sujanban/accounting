const mongoose = require("mongoose");

const TRANSACTION_TYPES = new Set(["JOURNAL", "RECEIPT", "PAYMENT", "CONTRA", "SALE", "PURCHASE", "INVENTORY_ADJUSTMENT", "STOCK_TRANSFER"]);
const VOUCHER_TYPES = new Set(["JV", "RV", "PMV", "CV", "SV", "PV"]);
const VOUCHERS_BY_TRANSACTION = Object.freeze({ JOURNAL: "JV", RECEIPT: "RV", PAYMENT: "PMV", CONTRA: "CV", SALE: "SV", PURCHASE: "PV", INVENTORY_ADJUSTMENT: "JV", STOCK_TRANSFER: "JV" });
const CREATE_FIELDS = new Set(["transactionType", "voucherType", "transactionDate", "narration", "items", "accountingEntries", "inventoryEntries"]);
const UPDATE_FIELDS = new Set(["transactionDate", "referenceNo", "narration", "items", "accountingEntries", "inventoryEntries"]);

const isValidId = (value) => typeof value === "string" && mongoose.isObjectIdOrHexString(value);
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

function validateOptionalText(body, field, maxLength, errors) {
  if (body[field] !== undefined && body[field] !== null && (typeof body[field] !== "string" || body[field].trim().length > maxLength)) {
    errors.push({ field, message: `${field} must be text with at most ${maxLength} characters.` });
  }
}

function validateAccountingEntries(entries, errors) {
  if (!Array.isArray(entries)) return;
  entries.forEach((entry, index) => {
    const field = `accountingEntries[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return errors.push({ field, message: "Each accounting entry must be an object." });
    if (!isValidId(entry.ledgerId)) errors.push({ field: `${field}.ledgerId`, message: "Ledger must be a valid identifier." });
    if (!isFiniteNumber(entry.debit) || entry.debit < 0) errors.push({ field: `${field}.debit`, message: "Debit must be a non-negative number." });
    if (!isFiniteNumber(entry.credit) || entry.credit < 0) errors.push({ field: `${field}.credit`, message: "Credit must be a non-negative number." });
    if (entry.narration !== undefined && entry.narration !== null && (typeof entry.narration !== "string" || entry.narration.length > 1000)) errors.push({ field: `${field}.narration`, message: "Narration must be text with at most 1000 characters." });
  });
}

function validateInventoryEntries(entries, errors) {
  if (!Array.isArray(entries)) return;
  entries.forEach((entry, index) => {
    const field = `inventoryEntries[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return errors.push({ field, message: "Each inventory entry must be an object." });
    if (!isValidId(entry.productId)) errors.push({ field: `${field}.productId`, message: "Product must be a valid identifier." });
    if (!isValidId(entry.warehouseId)) errors.push({ field: `${field}.warehouseId`, message: "Warehouse must be a valid identifier." });
    if (!isFiniteNumber(entry.quantity) || entry.quantity <= 0) errors.push({ field: `${field}.quantity`, message: "Quantity must be a positive number." });
    if (!isFiniteNumber(entry.unitCost) || entry.unitCost < 0) errors.push({ field: `${field}.unitCost`, message: "Unit cost must be a non-negative number." });
    if (!["IN", "OUT"].includes(entry.direction)) errors.push({ field: `${field}.direction`, message: "Direction must be IN or OUT." });
  });
}

function validateTransaction(body, partial = false) {
  const errors = [];
  const fields = partial ? UPDATE_FIELDS : CREATE_FIELDS;
  for (const field of Object.keys(body)) if (!fields.has(field)) errors.push({ field, message: "This field cannot be modified." });
  if (!partial && !TRANSACTION_TYPES.has(body.transactionType)) errors.push({ field: "transactionType", message: "A valid transaction type is required." });
  if (!partial && !VOUCHER_TYPES.has(body.voucherType)) errors.push({ field: "voucherType", message: "A valid voucher type is required." });
  if (!partial && TRANSACTION_TYPES.has(body.transactionType) && body.voucherType !== VOUCHERS_BY_TRANSACTION[body.transactionType]) errors.push({ field: "voucherType", message: "Voucher type is not compatible with the transaction type." });
  if ((!partial || body.transactionDate !== undefined) && (!body.transactionDate || typeof body.transactionDate !== "string" || Number.isNaN(new Date(body.transactionDate).getTime()))) errors.push({ field: "transactionDate", message: "A valid transaction date is required." });
  for (const field of ["accountingEntries", "inventoryEntries", "items"]) if (body[field] !== undefined && (!Array.isArray(body[field]) || body[field].length > 500)) errors.push({ field, message: `${field} must be an array with at most 500 entries.` });
  validateOptionalText(body, "narration", 2000, errors);
  validateAccountingEntries(body.accountingEntries, errors);
  validateInventoryEntries(body.inventoryEntries, errors);
  if (partial && !Object.keys(body).length) errors.push({ field: "body", message: "At least one field must be provided." });
  return errors;
}
module.exports = { validateCreateTransaction: (body) => validateTransaction(body), validateUpdateTransaction: (body) => validateTransaction(body, true), validateTransaction, VOUCHERS_BY_TRANSACTION };
