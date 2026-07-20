const mongoose = require("mongoose");
const { Transaction } = require("../models/Transaction");
const { Journal, JournalLine } = require("../models/Journal");
const { InventoryMovement } = require("../models/InventoryMovement");
const { Ledger } = require("../models/Ledger");
const { ApiError } = require("../utils/apiError");
const { assertFiscalYearWritable } = require("./fiscalYearGuardService");
const { getNextVoucherNumber } = require("./voucherSequenceService");
const { eventBus } = require("../events/eventBus");
const { DOMAIN_EVENTS } = require("../shared/constants/events");
const { resolveDefaultBranch } = require("./branchService");

const MAX_LIMIT = 100;

function totals(entries) {
  return entries.reduce((result, entry) => ({ debit: result.debit + Number(entry.debit || 0), credit: result.credit + Number(entry.credit || 0) }), { debit: 0, credit: 0 });
}

function assertBalanced(entries) {
  if (!entries.length) throw new ApiError(422, "At least one accounting entry is required.");
  const invalid = entries.some((entry) => !entry.ledgerId || !Number.isFinite(Number(entry.debit)) || !Number.isFinite(Number(entry.credit)) || (Number(entry.debit) <= 0 && Number(entry.credit) <= 0) || (Number(entry.debit) > 0 && Number(entry.credit) > 0));
  if (invalid) throw new ApiError(422, "Each accounting entry requires one positive debit or credit amount.");
  const result = totals(entries);
  if (Math.abs(result.debit - result.credit) > 0.000001) throw new ApiError(422, "Debit and credit totals must be equal.");
  return result;
}

async function assertActiveLedgers(companyId, fiscalYearId, entries, session) {
  const ledgerIds = [...new Set(entries.map((entry) => String(entry.ledgerId)))];
  const count = await Ledger.countDocuments({ _id: { $in: ledgerIds }, companyId, fiscalYearId, isActive: true }).session(session);
  if (count !== ledgerIds.length) throw new ApiError(422, "One or more accounting ledgers are invalid or inactive.");
}

function mapTransaction(transaction) {
  return { id: transaction._id, companyId: transaction.companyId, branchId: transaction.branchId, fiscalYearId: transaction.fiscalYearId, transactionType: transaction.transactionType, voucherType: transaction.voucherType, voucherNumber: transaction.voucherNumber, transactionDate: transaction.transactionDate, referenceNo: transaction.referenceNo, narration: transaction.narration, items: transaction.items, accountingEntries: transaction.accountingEntries, inventoryEntries: transaction.inventoryEntries, status: transaction.status, journalId: transaction.journalId, reversalOfId: transaction.reversalOfId, reversedById: transaction.reversedById, postedAt: transaction.postedAt, postedBy: transaction.postedBy, createdAt: transaction.createdAt, updatedAt: transaction.updatedAt };
}

async function createDraft(companyId, fiscalYearId, payload) {
  await assertFiscalYearWritable(companyId, fiscalYearId, { transactionDate: payload.transactionDate });
  const branch = await resolveDefaultBranch(companyId);
  const draft = await Transaction.create({ ...payload, companyId, fiscalYearId, branchId: payload.branchId || branch._id, status: "DRAFT", voucherNumber: null, createdBy: payload.actorUserId, updatedBy: payload.actorUserId });
  return mapTransaction(draft);
}

async function updateDraft(companyId, fiscalYearId, transactionId, payload) {
  const draft = await Transaction.findOne({ _id: transactionId, companyId, fiscalYearId });
  if (!draft) throw new ApiError(404, "Transaction was not found.");
  if (draft.status !== "DRAFT") throw new ApiError(409, "Only draft transactions can be edited.");
  await assertFiscalYearWritable(companyId, fiscalYearId, { transactionDate: payload.transactionDate || draft.transactionDate });
  for (const field of ["transactionDate", "referenceNo", "narration", "items", "accountingEntries", "inventoryEntries"]) if (payload[field] !== undefined) draft[field] = payload[field];
  draft.updatedBy = payload.actorUserId;
  await draft.save();
  return mapTransaction(draft);
}

async function postTransaction(companyId, fiscalYearId, transactionId, actorUserId) {
  const session = await mongoose.startSession();
  let posted;
  try {
    await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({ _id: transactionId, companyId, fiscalYearId }).session(session);
      if (!transaction) throw new ApiError(404, "Transaction was not found.");
      if (transaction.status !== "DRAFT") throw new ApiError(409, "Only draft transactions can be posted.");
      await assertFiscalYearWritable(companyId, fiscalYearId, { transactionDate: transaction.transactionDate });
      const result = assertBalanced(transaction.accountingEntries);
      await assertActiveLedgers(companyId, fiscalYearId, transaction.accountingEntries, session);
      if (transaction.inventoryEntries.length) throw new ApiError(422, "Inventory posting requires the Phase 3 product and warehouse masters.");
      const voucherNumber = await getNextVoucherNumber(companyId, fiscalYearId, transaction.voucherType, session);
      const journal = await Journal.create([{ companyId, fiscalYearId, transactionId: transaction._id, voucherNumber, transactionDate: transaction.transactionDate, narration: transaction.narration, totalDebit: result.debit, totalCredit: result.credit, createdBy: actorUserId, updatedBy: actorUserId }], { session });
      await JournalLine.insertMany(transaction.accountingEntries.map((entry) => ({ companyId, journalId: journal[0]._id, ledgerId: entry.ledgerId, debit: Number(entry.debit || 0), credit: Number(entry.credit || 0), narration: entry.narration, createdBy: actorUserId, updatedBy: actorUserId })), { session });
      transaction.voucherNumber = voucherNumber; transaction.journalId = journal[0]._id; transaction.status = "POSTED"; transaction.postedAt = new Date(); transaction.postedBy = actorUserId; transaction.updatedBy = actorUserId;
      await transaction.save({ session });
      posted = transaction;
    });
  } finally { await session.endSession(); }
  await eventBus.emitAsync(DOMAIN_EVENTS.TRANSACTION_POSTED, { transaction: posted, companyId, fiscalYearId, actorUserId });
  await eventBus.emitAsync(DOMAIN_EVENTS.JOURNAL_CREATED, { transaction: posted, companyId, fiscalYearId, actorUserId });
  return mapTransaction(posted);
}

async function reverseTransaction(companyId, fiscalYearId, transactionId, actorUserId) {
  const original = await Transaction.findOne({ _id: transactionId, companyId, fiscalYearId }).lean();
  if (!original) throw new ApiError(404, "Transaction was not found.");
  if (original.status !== "POSTED" || original.reversedById) throw new ApiError(409, "Only unreversed posted transactions can be reversed.");
  const reversal = await Transaction.create({ companyId, fiscalYearId, transactionType: "JOURNAL", voucherType: "JV", transactionDate: original.transactionDate, referenceNo: original.voucherNumber, narration: `Reversal of ${original.voucherNumber}`, accountingEntries: original.accountingEntries.map((entry) => ({ ledgerId: entry.ledgerId, debit: entry.credit, credit: entry.debit, narration: entry.narration })), reversalOfId: original._id, status: "DRAFT", createdBy: actorUserId, updatedBy: actorUserId });
  const posted = await postTransaction(companyId, fiscalYearId, reversal._id, actorUserId);
  await Transaction.updateOne({ _id: original._id, companyId }, { $set: { status: "REVERSED", reversedById: posted.id, updatedBy: actorUserId } });
  return posted;
}

async function getTransaction(companyId, transactionId) {
  const transaction = await Transaction.findOne({ _id: transactionId, companyId }).lean();
  if (!transaction) throw new ApiError(404, "Transaction was not found.");
  return mapTransaction(transaction);
}

async function listTransactions(companyId, query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1); const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const filters = { companyId }; if (query.status) filters.status = query.status; if (query.transactionType) filters.transactionType = query.transactionType;
  const [transactions, total] = await Promise.all([Transaction.find(filters).sort({ transactionDate: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), Transaction.countDocuments(filters)]);
  return { items: transactions.map(mapTransaction), meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } };
}

module.exports = { createDraft, updateDraft, postTransaction, reverseTransaction, getTransaction, listTransactions };
