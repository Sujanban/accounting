const { validateTransaction, validateUpdateTransaction } = require("./transactionValidators");
const FIELDS = new Set(["transactionDate", "narration", "items", "accountingEntries", "inventoryEntries"]);

function validateVoucherDraft(body) {
  const errors = [];
  for (const field of Object.keys(body)) if (!FIELDS.has(field)) errors.push({ field, message: "This field cannot be submitted for this voucher." });
  errors.push(...validateTransaction({ ...body, transactionType: "JOURNAL", voucherType: "JV" }).filter((error) => error.field !== "transactionType" && error.field !== "voucherType"));
  return errors;
}

const validateVoucherUpdate = (body) => validateUpdateTransaction(body);

module.exports = { validateVoucherDraft, validateVoucherUpdate };
