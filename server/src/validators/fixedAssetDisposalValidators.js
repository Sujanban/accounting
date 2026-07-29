const mongoose = require("mongoose");

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateDisposalDraft(body) {
  const errors = [];
  const allowed = new Set(["transactionDate", "proceeds", "accumulatedDepreciation", "assetCostLedgerId", "accumulatedDepreciationLedgerId", "proceedsLedgerId", "gainLossLedgerId"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!isIsoDate(body.transactionDate)) errors.push({ field: "transactionDate", message: "Transaction date must be a valid YYYY-MM-DD date." });
  for (const field of ["proceeds", "accumulatedDepreciation"]) if (!Number.isFinite(body[field]) || body[field] < 0) errors.push({ field, message: "Amount must be a non-negative number." });
  for (const field of ["assetCostLedgerId", "accumulatedDepreciationLedgerId", "proceedsLedgerId", "gainLossLedgerId"]) if (!mongoose.isObjectIdOrHexString(body[field])) errors.push({ field, message: "Ledger must be a valid identifier." });
  return errors;
}

module.exports = { validateDisposalDraft };
