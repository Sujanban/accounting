const { validateTransaction, validateUpdateTransaction } = require("./transactionValidators");
const FIELDS = new Set(["branchId", "transactionDate", "narration", "items", "taxDetails", "accountingEntries", "inventoryEntries"]);

function validateVoucherDraft(body, transactionType = "JOURNAL") {
  const errors = [];
  for (const field of Object.keys(body)) if (!FIELDS.has(field)) errors.push({ field, message: "This field cannot be submitted for this voucher." });
  const voucherType = { SALE: "SV", PURCHASE: "PV", RECEIPT: "RV", PAYMENT: "PMV", CONTRA: "CV", JOURNAL: "JV" }[transactionType];
  errors.push(...validateTransaction({ ...body, transactionType, voucherType }).filter((error) => error.field !== "transactionType" && error.field !== "voucherType"));
  return errors;
}

const validateVoucherUpdate = (body) => validateUpdateTransaction(body);

module.exports = { validateVoucherDraft, validateVoucherUpdate };
