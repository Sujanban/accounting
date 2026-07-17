const { JournalEntry } = require("../models/JournalEntry");
const { JournalLine } = require("../models/JournalLine");
const { Ledger } = require("../models/Ledger");
const { VoucherSequence } = require("../models/VoucherSequence");
const { ApiError } = require("../utils/apiError");

function formatVoucherNumber(number) {
  return `JV-${String(number).padStart(6, "0")}`;
}

async function getNextVoucherNumber(companyId) {
  const sequence = await VoucherSequence.findOneAndUpdate(
    { companyId, type: "JV" },
    { $inc: { currentNumber: 1 } },
    { new: true }
  );

  if (!sequence) {
    throw new ApiError(500, "Voucher sequence is not initialized.");
  }

  return formatVoucherNumber(sequence.currentNumber);
}

function validateRows(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    throw new ApiError(400, "At least two journal rows are required.");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const row of rows) {
    const debit = Number(row.debit || 0);
    const credit = Number(row.credit || 0);

    if (!row.ledgerId) {
      throw new ApiError(400, "Every journal row must include a ledger.");
    }

    if ((debit <= 0 && credit <= 0) || (debit > 0 && credit > 0)) {
      throw new ApiError(400, "Each journal row must have either debit or credit.");
    }

    totalDebit += debit;
    totalCredit += credit;
  }

  if (totalDebit !== totalCredit) {
    throw new ApiError(400, "Journal entry must be balanced.");
  }

  return {
    totalDebit,
    totalCredit
  };
}

async function createJournalEntry({
  companyId,
  fiscalYearId,
  date,
  narration,
  rows,
  sourceType = "MANUAL",
  isSystem = false
}) {
  validateRows(rows);

  const ledgers = await Ledger.find({
    _id: { $in: [...new Set(rows.map((row) => String(row.ledgerId)))] },
    companyId,
    fiscalYearId
  }).lean();

  if (ledgers.length !== [...new Set(rows.map((row) => String(row.ledgerId)))].length) {
    throw new ApiError(400, "One or more journal ledgers are invalid for the active company.");
  }

  const voucherNumber = await getNextVoucherNumber(companyId);

  const journalEntry = await JournalEntry.create({
    companyId,
    fiscalYearId,
    voucherNumber,
    date,
    narration: narration ? narration.trim() : null,
    sourceType,
    isSystem,
    isPosted: true
  });

  const lines = await JournalLine.insertMany(
    rows.map((row) => ({
      companyId,
      fiscalYearId,
      journalEntryId: journalEntry._id,
      ledgerId: row.ledgerId,
      debit: Number(row.debit || 0),
      credit: Number(row.credit || 0),
      remarks: row.remarks ? row.remarks.trim() : null
    }))
  );

  return {
    entry: journalEntry,
    lines
  };
}

async function createOpeningBalanceJournal({
  companyId,
  fiscalYearId,
  ledgerId,
  amount,
  balanceType,
  narration
}) {
  if (!amount || Number(amount) <= 0) {
    return null;
  }

  const capitalLedger = await Ledger.findOne({
    companyId,
    fiscalYearId,
    name: "Capital"
  });

  if (!capitalLedger) {
    throw new ApiError(500, "Capital ledger is missing for opening balance posting.");
  }

  const debitFirst = balanceType === "DEBIT";

  return createJournalEntry({
    companyId,
    fiscalYearId,
    date: new Date(),
    narration,
    sourceType: "OPENING_BALANCE",
    isSystem: true,
    rows: [
      {
        ledgerId,
        debit: debitFirst ? amount : 0,
        credit: debitFirst ? 0 : amount,
        remarks: "Opening balance"
      },
      {
        ledgerId: capitalLedger._id,
        debit: debitFirst ? 0 : amount,
        credit: debitFirst ? amount : 0,
        remarks: "Opening balance offset"
      }
    ]
  });
}

function mapJournalEntry(entry, lines = []) {
  return {
    id: entry._id,
    companyId: entry.companyId,
    fiscalYearId: entry.fiscalYearId,
    voucherType: entry.voucherType,
    voucherNumber: entry.voucherNumber,
    date: entry.date,
    narration: entry.narration,
    sourceType: entry.sourceType,
    isPosted: entry.isPosted,
    isSystem: entry.isSystem,
    createdAt: entry.createdAt,
    lines: lines.map((line) => ({
      id: line._id,
      ledgerId: line.ledgerId,
      debit: line.debit,
      credit: line.credit,
      remarks: line.remarks
    }))
  };
}

async function listJournalEntries(companyId, fiscalYearId) {
  const entries = await JournalEntry.find({ companyId, fiscalYearId })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const entryIds = entries.map((entry) => entry._id);
  const lines = await JournalLine.find({ journalEntryId: { $in: entryIds } }).lean();

  return entries.map((entry) =>
    mapJournalEntry(
      entry,
      lines.filter((line) => String(line.journalEntryId) === String(entry._id))
    )
  );
}

module.exports = {
  createJournalEntry,
  createOpeningBalanceJournal,
  listJournalEntries,
  mapJournalEntry
};
