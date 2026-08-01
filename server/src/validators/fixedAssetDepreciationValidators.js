const mongoose = require("mongoose");
const { isValidBsDate } = require("../services/nepalDateService");

function validateDepreciationDraft(body) {
  const errors = [];
  const allowed = new Set(["periodMonth", "transactionDate", "expenseLedgerId", "accumulatedDepreciationLedgerId"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!Number.isInteger(body.periodMonth) || body.periodMonth < 1 || body.periodMonth > 1200) errors.push({ field: "periodMonth", message: "Period month must be a positive whole number." });
  if (!isValidBsDate(body.transactionDate)) errors.push({ field: "transactionDate", message: "Transaction date must be a valid Bikram Sambat date in YYYY-MM-DD format." });
  for (const field of ["expenseLedgerId", "accumulatedDepreciationLedgerId"]) if (!mongoose.isObjectIdOrHexString(body[field])) errors.push({ field, message: "Ledger must be a valid identifier." });
  if (body.expenseLedgerId && body.expenseLedgerId === body.accumulatedDepreciationLedgerId) errors.push({ field: "accumulatedDepreciationLedgerId", message: "Use separate expense and accumulated-depreciation ledgers." });
  return errors;
}

module.exports = { validateDepreciationDraft };
