const mongoose = require("mongoose");
const { Transaction } = require("../models/Transaction");
const { Journal, JournalLine } = require("../models/Journal");
const { InventoryMovement } = require("../models/InventoryMovement");
const { Ledger } = require("../models/Ledger");
const { Product } = require("../models/Product");
const { Warehouse } = require("../models/Warehouse");
const { Setting } = require("../models/Setting");
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

async function validateInventoryEntries(companyId, branchId, entries, session) {
  for (const entry of entries) {
    if (!entry.productId || !entry.warehouseId || !["IN", "OUT"].includes(entry.direction) || !Number.isFinite(Number(entry.quantity)) || Number(entry.quantity) <= 0 || !Number.isFinite(Number(entry.unitCost || 0)) || Number(entry.unitCost || 0) < 0) throw new ApiError(422, "Inventory entries require product, warehouse, direction, and positive quantity.");
    const [product, warehouse] = await Promise.all([Product.findOne({ _id: entry.productId, companyId, isActive: true }).session(session), Warehouse.findOne({ _id: entry.warehouseId, companyId, branchId, isActive: true }).session(session)]);
    if (!product || product.isService || !warehouse) throw new ApiError(422, "Inventory entries require active stock products and warehouses in the transaction branch.");
  }
}

async function assertStockAvailable(companyId, branchId, entries, session) {
  if (!entries.length) return;
  const settings = await Setting.findOne({ companyId }).select("allowNegativeStock").session(session).lean();
  if (settings?.allowNegativeStock) return;
  const changes = new Map();
  for (const entry of entries) {
    const key = `${entry.productId}:${entry.warehouseId}`;
    changes.set(key, (changes.get(key) || 0) + (entry.direction === "IN" ? Number(entry.quantity) : -Number(entry.quantity)));
  }
  for (const [key, change] of changes) {
    if (change >= 0) continue;
    const [productId, warehouseId] = key.split(":");
    const balances = await InventoryMovement.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), branchId: new mongoose.Types.ObjectId(branchId), productId: new mongoose.Types.ObjectId(productId), warehouseId: new mongoose.Types.ObjectId(warehouseId) } },
      { $group: { _id: null, balance: { $sum: { $cond: [{ $eq: ["$direction", "IN"] }, "$quantity", { $multiply: ["$quantity", -1] }] } } } }
    ]).session(session);
    if (Number(balances[0]?.balance || 0) + change < 0) throw new ApiError(422, "This transaction would result in negative stock.");
  }
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

async function postTransactionInSession(companyId, fiscalYearId, transactionId, actorUserId, session, { isReversal = false } = {}) {
  const transaction = await Transaction.findOne({ _id: transactionId, companyId, fiscalYearId }).session(session);
  if (!transaction) throw new ApiError(404, "Transaction was not found.");
  if (transaction.status !== "DRAFT") throw new ApiError(409, "Only draft transactions can be posted.");
  await assertFiscalYearWritable(companyId, fiscalYearId, { transactionDate: transaction.transactionDate });
  const result = assertBalanced(transaction.accountingEntries);
  await assertActiveLedgers(companyId, fiscalYearId, transaction.accountingEntries, session);
  await validateInventoryEntries(companyId, transaction.branchId, transaction.inventoryEntries, session);
  await assertStockAvailable(companyId, transaction.branchId, transaction.inventoryEntries, session);
  const voucherNumber = await getNextVoucherNumber(companyId, fiscalYearId, transaction.voucherType, session);
  const journal = await Journal.create([{ companyId, branchId: transaction.branchId, fiscalYearId, transactionId: transaction._id, voucherNumber, transactionDate: transaction.transactionDate, narration: transaction.narration, totalDebit: result.debit, totalCredit: result.credit, isReversal, createdBy: actorUserId, updatedBy: actorUserId }], { session });
  await JournalLine.insertMany(transaction.accountingEntries.map((entry) => ({ companyId, journalId: journal[0]._id, ledgerId: entry.ledgerId, debit: Number(entry.debit || 0), credit: Number(entry.credit || 0), narration: entry.narration, createdBy: actorUserId, updatedBy: actorUserId })), { session });
  if (transaction.inventoryEntries.length) await InventoryMovement.insertMany(transaction.inventoryEntries.map((entry) => ({ companyId, branchId: transaction.branchId, fiscalYearId, transactionId: transaction._id, productId: entry.productId, warehouseId: entry.warehouseId, movementType: transaction.transactionType, direction: entry.direction, quantity: Number(entry.quantity), unitCost: Number(entry.unitCost || 0), transactionDate: transaction.transactionDate, createdBy: actorUserId, updatedBy: actorUserId })), { session });
  transaction.voucherNumber = voucherNumber; transaction.journalId = journal[0]._id; transaction.status = "POSTED"; transaction.postedAt = new Date(); transaction.postedBy = actorUserId; transaction.updatedBy = actorUserId;
  await transaction.save({ session });
  return transaction;
}

async function postTransaction(companyId, fiscalYearId, transactionId, actorUserId) {
  const session = await mongoose.startSession();
  let posted;
  try { await session.withTransaction(async () => { posted = await postTransactionInSession(companyId, fiscalYearId, transactionId, actorUserId, session); }); } finally { await session.endSession(); }
  await eventBus.emitAsync(DOMAIN_EVENTS.TRANSACTION_POSTED, { transaction: posted, companyId, fiscalYearId, actorUserId });
  await eventBus.emitAsync(DOMAIN_EVENTS.JOURNAL_CREATED, { transaction: posted, companyId, fiscalYearId, actorUserId });
  if (posted.inventoryEntries.length) await eventBus.emitAsync(DOMAIN_EVENTS.INVENTORY_UPDATED, { transaction: posted, companyId, fiscalYearId, actorUserId });
  return mapTransaction(posted);
}

async function reverseTransaction(companyId, fiscalYearId, transactionId, actorUserId) {
  const session = await mongoose.startSession(); let posted;
  try { await session.withTransaction(async () => {
    const original = await Transaction.findOne({ _id: transactionId, companyId, fiscalYearId }).session(session);
    if (!original) throw new ApiError(404, "Transaction was not found.");
    if (original.status !== "POSTED" || original.reversedById) throw new ApiError(409, "Only unreversed posted transactions can be reversed.");
    const reversal = await Transaction.create([{ companyId, branchId: original.branchId, fiscalYearId, transactionType: "JOURNAL", voucherType: "JV", transactionDate: original.transactionDate, referenceNo: original.voucherNumber, narration: `Reversal of ${original.voucherNumber}`, accountingEntries: original.accountingEntries.map((entry) => ({ ledgerId: entry.ledgerId, debit: entry.credit, credit: entry.debit, narration: entry.narration })), inventoryEntries: original.inventoryEntries.map((entry) => ({ productId: entry.productId, warehouseId: entry.warehouseId, quantity: entry.quantity, unitCost: entry.unitCost, direction: entry.direction === "IN" ? "OUT" : "IN" })), reversalOfId: original._id, status: "DRAFT", createdBy: actorUserId, updatedBy: actorUserId }], { session });
    posted = await postTransactionInSession(companyId, fiscalYearId, reversal[0]._id, actorUserId, session, { isReversal: true });
    original.status = "REVERSED"; original.reversedById = posted._id; original.updatedBy = actorUserId; await original.save({ session });
  }); } finally { await session.endSession(); }
  await eventBus.emitAsync(DOMAIN_EVENTS.TRANSACTION_POSTED, { transaction: posted, companyId, fiscalYearId, actorUserId });
  await eventBus.emitAsync(DOMAIN_EVENTS.TRANSACTION_REVERSED, { transaction: posted, originalTransactionId: transactionId, companyId, fiscalYearId, actorUserId });
  if (posted.inventoryEntries.length) await eventBus.emitAsync(DOMAIN_EVENTS.INVENTORY_UPDATED, { transaction: posted, companyId, fiscalYearId, actorUserId });
  return mapTransaction(posted);
}

async function getTransaction(companyId, transactionId) {
  const transaction = await Transaction.findOne({ _id: transactionId, companyId }).lean();
  if (!transaction) throw new ApiError(404, "Transaction was not found.");
  return mapTransaction(transaction);
}

async function listTransactions(companyId, fiscalYearId, query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1); const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const filters = { companyId, fiscalYearId }; if (query.status) filters.status = query.status; if (query.transactionType) filters.transactionType = query.transactionType; if (query.branchId) filters.branchId = query.branchId;
  const [transactions, total] = await Promise.all([Transaction.find(filters).sort({ transactionDate: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), Transaction.countDocuments(filters)]);
  return { items: transactions.map(mapTransaction), meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } };
}

module.exports = { createDraft, updateDraft, postTransaction, reverseTransaction, getTransaction, listTransactions };
