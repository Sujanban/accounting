const { Journal, JournalLine } = require("../models/Journal");
const { Transaction } = require("../models/Transaction");
const { Ledger } = require("../models/Ledger");
const { InventoryMovement } = require("../models/InventoryMovement");
const { Product } = require("../models/Product");
const { AccountGroup } = require("../models/AccountGroup");
const { Contact } = require("../models/Contact");
const { ContactLedger } = require("../models/ContactLedger");
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

async function getStockLedger(companyId, fiscalYearId, query) {
  const range = dateRange(query);
  const filters = { companyId, fiscalYearId, productId: query.productId };
  if (query.warehouseId) filters.warehouseId = query.warehouseId;
  const product = await Product.findOne({ _id: query.productId, companyId }).select("name sku").lean();
  if (!product) throw new ApiError(404, "Product was not found.");
  const allMovements = await InventoryMovement.find(filters).select("warehouseId movementType direction quantity unitCost transactionDate transactionId").sort({ transactionDate: 1, _id: 1 }).lean();
  const fromDate = range?.$gte;
  let openingQuantity = 0;
  let openingValue = 0;
  const entries = [];
  for (const movement of allMovements) {
    const quantity = Number(movement.quantity || 0);
    const value = quantity * Number(movement.unitCost || 0);
    const isIn = movement.direction === "IN";
    if (fromDate && movement.transactionDate < fromDate) {
      openingQuantity += isIn ? quantity : -quantity;
      openingValue += isIn ? value : -value;
      continue;
    }
    if (range?.$lte && movement.transactionDate > range.$lte) continue;
    openingQuantity += isIn ? quantity : -quantity;
    openingValue += isIn ? value : -value;
    entries.push({ id: movement._id, transactionId: movement.transactionId, transactionDate: movement.transactionDate, warehouseId: movement.warehouseId, movementType: movement.movementType, quantityIn: isIn ? quantity : 0, quantityOut: isIn ? 0 : quantity, runningQuantity: openingQuantity, runningValue: openingValue });
  }
  return { product: { id: product._id, name: product.name, sku: product.sku }, openingQuantity: entries.length ? entries[0].runningQuantity - entries[0].quantityIn + entries[0].quantityOut : openingQuantity, closingQuantity: openingQuantity, closingValue: openingValue, entries };
}

async function getProfitLoss(companyId, fiscalYearId, query) {
  const range = dateRange(query);
  const journalFilters = { companyId, fiscalYearId, ...(range ? { transactionDate: range } : {}) };
  const rows = await JournalLine.aggregate([
    { $match: { companyId } },
    { $lookup: { from: "journals", localField: "journalId", foreignField: "_id", as: "journal" } },
    { $unwind: "$journal" },
    { $match: Object.fromEntries(Object.entries(journalFilters).map(([key, value]) => [`journal.${key}`, value])) },
    { $lookup: { from: "ledgers", localField: "ledgerId", foreignField: "_id", as: "ledger" } },
    { $unwind: "$ledger" },
    { $lookup: { from: "accountgroups", localField: "ledger.groupId", foreignField: "_id", as: "group" } },
    { $unwind: "$group" },
    { $match: { "group.category": { $in: ["Income", "Expenses"] } } },
    { $group: { _id: { ledgerId: "$ledger._id", category: "$group.category" }, ledgerName: { $first: "$ledger.name" }, debit: { $sum: "$debit" }, credit: { $sum: "$credit" } } },
    { $sort: { ledgerName: 1, "_id.ledgerId": 1 } }
  ]);
  const income = [];
  const expenses = [];
  for (const row of rows) {
    const amount = row._id.category === "Income" ? Number(row.credit || 0) - Number(row.debit || 0) : Number(row.debit || 0) - Number(row.credit || 0);
    const entry = { ledgerId: row._id.ledgerId, ledgerName: row.ledgerName, amount };
    if (row._id.category === "Income") income.push(entry); else expenses.push(entry);
  }
  const totalIncome = income.reduce((total, entry) => total + entry.amount, 0);
  const totalExpenses = expenses.reduce((total, entry) => total + entry.amount, 0);
  return { income, expenses, totals: { income: totalIncome, expenses: totalExpenses, netProfit: totalIncome - totalExpenses } };
}

async function getBalanceSheet(companyId, fiscalYearId, query) {
  const asOf = query.to ? new Date(`${query.to}T23:59:59.999Z`) : null;
  const journalFilters = { companyId, fiscalYearId, ...(asOf ? { transactionDate: { $lte: asOf } } : {}) };
  const movements = await JournalLine.aggregate([
    { $match: { companyId } },
    { $lookup: { from: "journals", localField: "journalId", foreignField: "_id", as: "journal" } },
    { $unwind: "$journal" },
    { $match: Object.fromEntries(Object.entries(journalFilters).map(([key, value]) => [`journal.${key}`, value])) },
    { $group: { _id: "$ledgerId", debit: { $sum: "$debit" }, credit: { $sum: "$credit" } } }
  ]);
  const movementByLedger = new Map(movements.map((row) => [String(row._id), { debit: Number(row.debit || 0), credit: Number(row.credit || 0) }]));
  const ledgers = await Ledger.find({ companyId, fiscalYearId }).select("name groupId openingBalance openingBalanceType").lean();
  const groupIds = [...new Set(ledgers.map((ledger) => String(ledger.groupId)))];
  const groups = await AccountGroup.find({ _id: { $in: groupIds }, companyId }).select("category").lean();
  const categoryByGroup = new Map(groups.map((group) => [String(group._id), group.category]));
  const categories = { Assets: [], Liabilities: [], Equity: [] };
  let currentEarnings = 0;
  for (const ledger of ledgers) {
    const category = categoryByGroup.get(String(ledger.groupId));
    const movement = movementByLedger.get(String(ledger._id)) || { debit: 0, credit: 0 };
    const opening = Number(ledger.openingBalance || 0) * (ledger.openingBalanceType === "CREDIT" ? -1 : 1);
    const debitBalance = opening + movement.debit - movement.credit;
    if (category === "Assets") categories.Assets.push({ ledgerId: ledger._id, ledgerName: ledger.name, amount: debitBalance });
    if (category === "Liabilities" || category === "Equity") categories[category].push({ ledgerId: ledger._id, ledgerName: ledger.name, amount: -debitBalance });
    if (category === "Income") currentEarnings -= debitBalance;
    if (category === "Expenses") currentEarnings += debitBalance;
  }
  const totals = { assets: categories.Assets.reduce((total, entry) => total + entry.amount, 0), liabilities: categories.Liabilities.reduce((total, entry) => total + entry.amount, 0), equity: categories.Equity.reduce((total, entry) => total + entry.amount, 0), currentEarnings };
  totals.totalEquity = totals.equity + totals.currentEarnings;
  totals.liabilitiesAndEquity = totals.liabilities + totals.totalEquity;
  return { assets: categories.Assets, liabilities: categories.Liabilities, equity: categories.Equity, totals, isBalanced: Math.abs(totals.assets - totals.liabilitiesAndEquity) < 0.000001 };
}

async function getContactStatement(companyId, fiscalYearId, query, role) {
  const contact = await Contact.findOne({ _id: query.contactId, companyId, isActive: true })
    .select("contactCode name displayName roles")
    .lean();
  if (!contact) throw new ApiError(404, "Contact was not found.");
  if (!contact.roles.includes(role)) throw new ApiError(422, `The contact is not a ${role.toLowerCase()}.`);

  const mapping = await ContactLedger.findOne({ companyId, fiscalYearId, contactId: contact._id, role }).lean();
  if (!mapping) throw new ApiError(422, "No fiscal-year ledger mapping exists for this contact statement.");
  const ledger = await Ledger.findOne({ _id: mapping.ledgerId, companyId, fiscalYearId, isActive: true })
    .select("name openingBalance openingBalanceType")
    .lean();
  if (!ledger) throw new ApiError(422, "The mapped statement ledger is unavailable.");

  const range = dateRange(query);
  const { value, limit } = page(query);
  const beforeRange = range?.$gte ? { "journal.transactionDate": { $lt: range.$gte } } : null;
  const basePipeline = [
    { $match: { companyId, ledgerId: ledger._id } },
    { $lookup: { from: "journals", localField: "journalId", foreignField: "_id", as: "journal" } },
    { $unwind: "$journal" },
    { $match: { "journal.companyId": companyId, "journal.fiscalYearId": fiscalYearId } }
  ];
  const [openingRows, lines] = await Promise.all([
    beforeRange ? JournalLine.aggregate([...basePipeline, { $match: beforeRange }, { $group: { _id: null, debit: { $sum: "$debit" }, credit: { $sum: "$credit" } } }]) : [],
    JournalLine.aggregate([...basePipeline, ...(range ? [{ $match: { "journal.transactionDate": range } }] : []), { $sort: { "journal.transactionDate": 1, _id: 1 } }])
  ]);
  const openingBalance = Number(ledger.openingBalance || 0) + Number(openingRows[0]?.debit || 0) - Number(openingRows[0]?.credit || 0);
  let runningBalance = openingBalance;
  const entries = lines.map((line) => {
    runningBalance += Number(line.debit || 0) - Number(line.credit || 0);
    return {
      journalId: line.journalId,
      transactionDate: line.journal.transactionDate,
      voucherNumber: line.journal.voucherNumber,
      narration: line.narration || line.journal.narration,
      debit: Number(line.debit || 0),
      credit: Number(line.credit || 0),
      runningBalance
    };
  });
  const total = entries.length;
  return {
    contact: { id: contact._id, contactCode: contact.contactCode, name: contact.displayName || contact.name, role },
    ledger: { id: ledger._id, name: ledger.name },
    openingBalance,
    entries: entries.slice((value - 1) * limit, value * limit),
    closingBalance: runningBalance,
    meta: { page: value, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: value * limit < total }
  };
}

function getCustomerStatement(companyId, fiscalYearId, query) {
  return getContactStatement(companyId, fiscalYearId, query, "CUSTOMER");
}

function getSupplierStatement(companyId, fiscalYearId, query) {
  return getContactStatement(companyId, fiscalYearId, query, "SUPPLIER");
}

module.exports = { getGeneralLedger, getTrialBalance, getJournalRegister, getDayBook, getStockSummary, getStockLedger, getProfitLoss, getBalanceSheet, getCustomerStatement, getSupplierStatement };
