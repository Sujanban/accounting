const TRANSACTION_TYPES = new Set(["JOURNAL", "RECEIPT", "PAYMENT", "CONTRA", "SALE", "PURCHASE", "EXPENSE", "OPENING_BALANCE", "INVENTORY_ADJUSTMENT", "STOCK_TRANSFER", "SALES_RETURN", "PURCHASE_RETURN", "DEBIT_NOTE", "CREDIT_NOTE"]);
const VOUCHER_TYPES = new Set(["JV", "RV", "PMV", "CV", "SV", "PV"]);
const FIELDS = new Set(["transactionType", "voucherType", "transactionDate", "referenceNo", "narration", "items", "accountingEntries", "inventoryEntries"]);
function validateTransaction(body, partial = false) {
  const errors = [];
  for (const field of Object.keys(body)) if (!FIELDS.has(field)) errors.push({ field, message: "This field cannot be modified." });
  if (!partial && !TRANSACTION_TYPES.has(body.transactionType)) errors.push({ field: "transactionType", message: "A valid transaction type is required." });
  if (!partial && !VOUCHER_TYPES.has(body.voucherType)) errors.push({ field: "voucherType", message: "A valid voucher type is required." });
  if (!partial && (!body.transactionDate || Number.isNaN(new Date(body.transactionDate).getTime()))) errors.push({ field: "transactionDate", message: "A valid transaction date is required." });
  if (body.accountingEntries !== undefined && !Array.isArray(body.accountingEntries)) errors.push({ field: "accountingEntries", message: "Accounting entries must be an array." });
  if (body.inventoryEntries !== undefined && !Array.isArray(body.inventoryEntries)) errors.push({ field: "inventoryEntries", message: "Inventory entries must be an array." });
  if (partial && !Object.keys(body).length) errors.push({ field: "body", message: "At least one field must be provided." });
  return errors;
}
module.exports = { validateCreateTransaction: (body) => validateTransaction(body), validateUpdateTransaction: (body) => validateTransaction(body, true) };
