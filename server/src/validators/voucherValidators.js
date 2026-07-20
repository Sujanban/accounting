const FIELDS = new Set(["transactionDate", "referenceNo", "narration", "items", "accountingEntries", "inventoryEntries"]);

function validateVoucherDraft(body) {
  const errors = [];
  for (const field of Object.keys(body)) if (!FIELDS.has(field)) errors.push({ field, message: "This field cannot be submitted for this voucher." });
  if (!body.transactionDate || Number.isNaN(new Date(body.transactionDate).getTime())) errors.push({ field: "transactionDate", message: "A valid voucher date is required." });
  if (body.accountingEntries !== undefined && !Array.isArray(body.accountingEntries)) errors.push({ field: "accountingEntries", message: "Accounting entries must be an array." });
  if (body.inventoryEntries !== undefined && !Array.isArray(body.inventoryEntries)) errors.push({ field: "inventoryEntries", message: "Inventory entries must be an array." });
  return errors;
}

module.exports = { validateVoucherDraft };
