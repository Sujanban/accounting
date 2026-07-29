const mongoose = require("mongoose");

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateDepreciationDraft(body) {
  const errors = [];
  const allowed = new Set(["periodMonth", "transactionDate", "expenseLedgerId", "accumulatedDepreciationLedgerId"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!Number.isInteger(body.periodMonth) || body.periodMonth < 1 || body.periodMonth > 1200) errors.push({ field: "periodMonth", message: "Period month must be a positive whole number." });
  if (!isIsoDate(body.transactionDate)) errors.push({ field: "transactionDate", message: "Transaction date must be a valid YYYY-MM-DD date." });
  for (const field of ["expenseLedgerId", "accumulatedDepreciationLedgerId"]) if (!mongoose.isObjectIdOrHexString(body[field])) errors.push({ field, message: "Ledger must be a valid identifier." });
  if (body.expenseLedgerId && body.expenseLedgerId === body.accumulatedDepreciationLedgerId) errors.push({ field: "accumulatedDepreciationLedgerId", message: "Use separate expense and accumulated-depreciation ledgers." });
  return errors;
}

module.exports = { validateDepreciationDraft };
