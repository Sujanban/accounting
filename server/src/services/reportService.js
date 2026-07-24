const { Journal, JournalLine } = require("../models/Journal");
const { Transaction } = require("../models/Transaction");
const { Ledger } = require("../models/Ledger");
const { InventoryMovement } = require("../models/InventoryMovement");
const { ApiError } = require("../utils/apiError");

const MAX_LIMIT = 100;

function dateRange(query) {
  const filters = {};
  if (query.from) filters.$gte = new Date(query.from);
  if (query.to) { const end = new Date(query.to); end.setUTCHours(23, 59, 59, 999); filters.$lte = end; }
  return Object.keys(filters).length ? filters : null;
}

function page(query) {
  const value = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { value, limit };
}

async function getGeneralLedger(companyId, fiscalYearId, query) {
  if (!query.ledgerId) throw new ApiError(400, "ledgerId is required.");
  const ledger = await Ledger.findOne({ _id: query.ledgerId, companyId, fiscalYearId }).lean();
  if (!ledger) throw new ApiError(404, "Ledger was not found.");
  const range = dateRange(query); const { value, limit } = page(query);
  const journalMatch = { companyId, fiscalYearId };
  if (range) journalMatch.transactionDate = range;
  const lines = await JournalLine.aggregate([
    { $match: { companyId, ledgerId: ledger._id } },
    { $lookup: { from: "journals", localField: "journalId", foreignField: "_id", as: "journal" } },
    { $unwind: "$journal" }, { $match: { "journal.companyId": companyId, "journal.fiscalYearId": fiscalYearId, ...(range ? { "journal.transactionDate": range } : {}) } },
    { $sort: { "journal.transactionDate": 1, _id: 1 } }
  ]);
  const openingLines = range && range.$gte ? await JournalLine.aggregate([
    { $match: { companyId, ledgerId: ledger._id } }, { $lookup: { from: "journals", localField: "journalId", foreignField: "_id", as: "journal" } }, { $unwind: "$journal" },
    { $match: { "journal.companyId": companyId, "journal.fiscalYearId": fiscalYearId, "journal.transactionDate": { $lt: range.$gte } } }, { $group: { _id: null, debit: { $sum: "$debit" }, credit: { $sum: "$credit" } } }
  ]) : [];
  let runningBalance = Number(ledger.openingBalance || 0) + Number(openingLines[0]?.debit || 0) - Number(openingLines[0]?.credit || 0);
  const entries = lines.map((line) => { runningBalance += Number(line.debit || 0) - Number(line.credit || 0); return { journalId: line.journalId, transactionDate: line.journal.transactionDate, voucherNumber: line.journal.voucherNumber, debit: line.debit, credit: line.credit, narration: line.narration || line.journal.narration, runningBalance }; });
  const total = entries.length;
  return { ledger: { id: ledger._id, name: ledger.name, openingBalance: ledger.openingBalance, openingBalanceType: ledger.openingBalanceType }, openingBalance: Number(ledger.openingBalance || 0) + Number(openingLines[0]?.debit || 0) - Number(openingLines[0]?.credit || 0), entries: entries.slice((value - 1) * limit, value * limit), closingBalance: runningBalance, meta: { page: value, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: value * limit < total } };
}

async function getTrialBalance(companyId, fiscalYearId, query) {
  const range = dateRange(query);
  const journalDateMatch = { companyId, fiscalYearId, ...(range ? { transactionDate: range } : {}) };
  const rows = await JournalLine.aggregate([
    { $match: { companyId } }, { $lookup: { from: "journals", localField: "journalId", foreignField: "_id", as: "journal" } }, { $unwind: "$journal" }, { $match: Object.fromEntries(Object.entries(journalDateMatch).map(([key, value]) => [`journal.${key}`, value])) },
    { $group: { _id: "$ledgerId", debit: { $sum: "$debit" }, credit: { $sum: "$credit" } } }, { $lookup: { from: "ledgers", localField: "_id", foreignField: "_id", as: "ledger" } }, { $unwind: "$ledger" }, { $sort: { "ledger.name": 1 } }
  ]);
  const data = rows.map((row) => ({ ledgerId: row._id, ledgerName: row.ledger.name, debit: row.debit, credit: row.credit, closing: row.debit - row.credit }));
  const totals = data.reduce((result, row) => ({ debit: result.debit + row.debit, credit: result.credit + row.credit }), { debit: 0, credit: 0 });
  return { data, totals, isBalanced: Math.abs(totals.debit - totals.credit) < 0.000001 };
}

async function getJournalRegister(companyId, fiscalYearId, query) {
  const { value, limit } = page(query); const filters = { companyId, fiscalYearId }; const range = dateRange(query); if (range) filters.transactionDate = range;
  const [items, total] = await Promise.all([Journal.find(filters).sort({ transactionDate: -1, _id: -1 }).skip((value - 1) * limit).limit(limit).lean(), Journal.countDocuments(filters)]);
  return { items, meta: { page: value, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: value * limit < total } };
}

async function getDayBook(companyId, fiscalYearId, query) {
  const { value, limit } = page(query); const filters = { companyId, fiscalYearId, status: { $in: ["POSTED", "REVERSED"] } }; const range = dateRange(query); if (range) filters.transactionDate = range;
  const [items, total] = await Promise.all([Transaction.find(filters).select("transactionType voucherType voucherNumber transactionDate narration status postedBy postedAt journalId").sort({ transactionDate: -1, _id: -1 }).skip((value - 1) * limit).limit(limit).lean(), Transaction.countDocuments(filters)]);
  return { items, meta: { page: value, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: value * limit < total } };
}

async function getStockSummary(companyId, fiscalYearId, query) {
  const filters = { companyId, fiscalYearId };
  const range = dateRange(query);
  if (range) filters.transactionDate = range;
  if (query.warehouseId) filters.warehouseId = query.warehouseId;
  const rows = await InventoryMovement.aggregate([
    { $match: filters },
    { $group: { _id: { productId: "$productId", warehouseId: "$warehouseId" }, quantityIn: { $sum: { $cond: [{ $eq: ["$direction", "IN"] }, "$quantity", 0] } }, quantityOut: { $sum: { $cond: [{ $eq: ["$direction", "OUT"] }, "$quantity", 0] } }, stockValue: { $sum: { $cond: [{ $eq: ["$direction", "IN"] }, { $multiply: ["$quantity", "$unitCost"] }, { $multiply: [{ $multiply: ["$quantity", "$unitCost"] }, -1] }] } } } },
    { $lookup: { from: "products", localField: "_id.productId", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $lookup: { from: "warehouses", localField: "_id.warehouseId", foreignField: "_id", as: "warehouse" } },
    { $unwind: "$warehouse" },
    { $project: { _id: 0, productId: "$_id.productId", productName: "$product.name", productSku: "$product.sku", warehouseId: "$_id.warehouseId", warehouseName: "$warehouse.name", quantityIn: 1, quantityOut: 1, quantityOnHand: { $subtract: ["$quantityIn", "$quantityOut"] }, stockValue: 1 } },
    { $sort: { productName: 1, warehouseName: 1, productId: 1 } }
  ]);
  return { items: rows, totals: rows.reduce((result, row) => ({ quantityIn: result.quantityIn + Number(row.quantityIn || 0), quantityOut: result.quantityOut + Number(row.quantityOut || 0), quantityOnHand: result.quantityOnHand + Number(row.quantityOnHand || 0), stockValue: result.stockValue + Number(row.stockValue || 0) }), { quantityIn: 0, quantityOut: 0, quantityOnHand: 0, stockValue: 0 }) };
}

module.exports = { getGeneralLedger, getTrialBalance, getJournalRegister, getDayBook, getStockSummary };
