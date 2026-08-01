const mongoose = require("mongoose");
const { isValidBsDate } = require("../services/nepalDateService");

function validateDisposalDraft(body) {
  const errors = [];
  const allowed = new Set(["transactionDate", "proceeds", "accumulatedDepreciation", "assetCostLedgerId", "accumulatedDepreciationLedgerId", "proceedsLedgerId", "gainLossLedgerId"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!isValidBsDate(body.transactionDate)) errors.push({ field: "transactionDate", message: "Transaction date must be a valid Bikram Sambat date in YYYY-MM-DD format." });
  for (const field of ["proceeds", "accumulatedDepreciation"]) if (!Number.isFinite(body[field]) || body[field] < 0) errors.push({ field, message: "Amount must be a non-negative number." });
  for (const field of ["assetCostLedgerId", "accumulatedDepreciationLedgerId", "proceedsLedgerId", "gainLossLedgerId"]) if (!mongoose.isObjectIdOrHexString(body[field])) errors.push({ field, message: "Ledger must be a valid identifier." });
  return errors;
}

module.exports = { validateDisposalDraft };
