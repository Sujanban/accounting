const TRANSACTION_TYPES = new Set(["JOURNAL", "RECEIPT", "PAYMENT", "CONTRA", "SALE", "PURCHASE", "EXPENSE", "OPENING_BALANCE", "INVENTORY_ADJUSTMENT", "STOCK_TRANSFER", "SALES_RETURN", "PURCHASE_RETURN", "DEBIT_NOTE", "CREDIT_NOTE"]);
const VOUCHER_TYPES = new Set(["JV", "RV", "PMV", "CV", "SV", "PV"]);
const VOUCHERS_BY_TRANSACTION = Object.freeze({ JOURNAL: "JV", RECEIPT: "RV", PAYMENT: "PMV", CONTRA: "CV", SALE: "SV", PURCHASE: "PV", EXPENSE: "PMV", OPENING_BALANCE: "JV", INVENTORY_ADJUSTMENT: "JV", STOCK_TRANSFER: "JV", SALES_RETURN: "SV", PURCHASE_RETURN: "PV", DEBIT_NOTE: "JV", CREDIT_NOTE: "JV" });
const FIELDS = new Set(["transactionType", "voucherType", "transactionDate", "referenceNo", "narration", "items", "accountingEntries", "inventoryEntries"]);
function validateTransaction(body, partial = false) {
  const errors = [];
  for (const field of Object.keys(body)) if (!FIELDS.has(field)) errors.push({ field, message: "This field cannot be modified." });
  if (!partial && !TRANSACTION_TYPES.has(body.transactionType)) errors.push({ field: "transactionType", message: "A valid transaction type is required." });
  if (!partial && !VOUCHER_TYPES.has(body.voucherType)) errors.push({ field: "voucherType", message: "A valid voucher type is required." });
  if (!partial && TRANSACTION_TYPES.has(body.transactionType) && body.voucherType !== VOUCHERS_BY_TRANSACTION[body.transactionType]) errors.push({ field: "voucherType", message: "Voucher type is not compatible with the transaction type." });
  if (!partial && (!body.transactionDate || Number.isNaN(new Date(body.transactionDate).getTime()))) errors.push({ field: "transactionDate", message: "A valid transaction date is required." });
  for (const field of ["accountingEntries", "inventoryEntries", "items"]) if (body[field] !== undefined && (!Array.isArray(body[field]) || body[field].length > 500)) errors.push({ field, message: `${field} must be an array with at most 500 entries.` });
  if (partial && !Object.keys(body).length) errors.push({ field: "body", message: "At least one field must be provided." });
  return errors;
}
module.exports = { validateCreateTransaction: (body) => validateTransaction(body), validateUpdateTransaction: (body) => validateTransaction(body, true), VOUCHERS_BY_TRANSACTION };
