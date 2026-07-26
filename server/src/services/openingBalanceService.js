const mongoose = require("mongoose");
const { FiscalYear } = require("../models/FiscalYear");
const { Ledger } = require("../models/Ledger");
const { Journal } = require("../models/Journal");
const { ApiError } = require("../utils/apiError");

function normalize(entries) {
  if (!Array.isArray(entries) || !entries.length || entries.length > 500) throw new ApiError(422, "Provide between 1 and 500 opening balance entries.");
  const ids = new Set(); let debit = 0; let credit = 0;
  const rows = entries.map((entry, index) => {
    if (!entry || !mongoose.isObjectIdOrHexString(entry.ledgerId) || !Number.isFinite(Number(entry.amount)) || Number(entry.amount) < 0 || !["DEBIT", "CREDIT"].includes(entry.balanceType)) throw new ApiError(422, `Opening balance entry ${index + 1} is invalid.`);
    if (ids.has(String(entry.ledgerId))) throw new ApiError(422, "Each ledger can appear only once."); ids.add(String(entry.ledgerId));
    const amount = Number(entry.amount); if (entry.balanceType === "DEBIT") debit += amount; else credit += amount;
    return { ledgerId: entry.ledgerId, amount, balanceType: entry.balanceType };
  });
  if (Math.abs(debit - credit) > 0.01) throw new ApiError(422, "Opening debit and credit totals must balance.");
  return { rows, totals: { debit, credit } };
}
async function preview(companyId, fiscalYearId, entries) {
  const result = normalize(entries); const count = await Ledger.countDocuments({ _id: { $in: result.rows.map((row) => row.ledgerId) }, companyId, fiscalYearId, isActive: true });
  if (count !== result.rows.length) throw new ApiError(422, "One or more opening-balance ledgers are unavailable.");
  return { entries: result.rows, totals: result.totals };
}
async function generate(companyId, fiscalYearId, actorUserId, entries) {
  const result = await preview(companyId, fiscalYearId, entries); const session = await mongoose.startSession();
  try { await session.withTransaction(async () => {
    const fiscalYear = await FiscalYear.findOne({ _id: fiscalYearId, companyId }).session(session); if (!fiscalYear) throw new ApiError(404, "Fiscal year was not found.");
    if (fiscalYear.isLocked || fiscalYear.openingBalancesAppliedAt) throw new ApiError(409, "Opening balances have already been finalized for this fiscal year.");
    if (await Journal.exists({ companyId, fiscalYearId }).session(session)) throw new ApiError(409, "Opening balances must be finalized before any journals are posted.");
    await Ledger.bulkWrite(result.rows.map((row) => ({ updateOne: { filter: { _id: row.ledgerId, companyId, fiscalYearId }, update: { $set: { openingBalance: row.amount, openingBalanceType: row.balanceType, updatedBy: actorUserId } } } })), { session });
    fiscalYear.openingBalancesAppliedAt = new Date(); fiscalYear.updatedBy = actorUserId; await fiscalYear.save({ session });
  }); } finally { await session.endSession(); }
  return { ...result, applied: true };
}
module.exports = { preview, generate };
