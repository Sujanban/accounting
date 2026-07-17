const { AccountGroup } = require("../models/AccountGroup");
const { JournalLine } = require("../models/JournalLine");
const { Ledger } = require("../models/Ledger");
const { ApiError } = require("../utils/apiError");
const { createOpeningBalanceJournal } = require("./journalService");

function normalizeSignedBalance(openingBalance, openingBalanceType) {
  return openingBalanceType === "DEBIT" ? openingBalance : -openingBalance;
}

function balanceTypeFromSignedAmount(amount) {
  return amount >= 0 ? "DEBIT" : "CREDIT";
}

function mapLedger(ledger) {
  return {
    id: ledger._id,
    companyId: ledger.companyId,
    fiscalYearId: ledger.fiscalYearId,
    name: ledger.name,
    code: ledger.code,
    accountGroup: ledger.accountGroup,
    parentLedgerId: ledger.parentLedgerId,
    openingBalance: ledger.openingBalance,
    openingBalanceType: ledger.openingBalanceType,
    description: ledger.description,
    sourceType: ledger.sourceType,
    sourceId: ledger.sourceId,
    isSystem: ledger.isSystem,
    isActive: ledger.isActive,
    createdAt: ledger.createdAt
  };
}

async function listAccountGroups(companyId) {
  const groups = await AccountGroup.find({ companyId, isActive: true }).sort({
    category: 1,
    name: 1
  });

  return groups.map((group) => ({
    id: group._id,
    companyId: group.companyId,
    name: group.name,
    category: group.category,
    parentGroupId: group.parentGroupId,
    isSystem: group.isSystem,
    isActive: group.isActive,
    createdAt: group.createdAt
  }));
}

async function listLedgers(companyId, fiscalYearId, query = {}) {
  const filters = {
    companyId,
    fiscalYearId
  };

  if (query.search) {
    filters.name = { $regex: query.search, $options: "i" };
  }

  if (query.accountGroup) {
    filters.accountGroup = query.accountGroup;
  }

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === "true";
  }

  const ledgers = await Ledger.find(filters).sort({ name: 1 }).lean();
  return ledgers.map(mapLedger);
}

async function createLedger(companyId, fiscalYearId, payload) {
  const ledger = await Ledger.create({
    companyId,
    fiscalYearId,
    name: payload.name.trim(),
    code: payload.code ? payload.code.trim() : null,
    accountGroup: payload.accountGroup,
    parentLedgerId: payload.parentLedgerId || null,
    openingBalance: Number(payload.openingBalance || 0),
    openingBalanceType: payload.openingBalanceType || "DEBIT",
    description: payload.description ? payload.description.trim() : null,
    isSystem: false,
    isActive: true
  });

  await createOpeningBalanceJournal({
    companyId,
    fiscalYearId,
    ledgerId: ledger._id,
    amount: ledger.openingBalance,
    balanceType: ledger.openingBalanceType,
    narration: `Opening balance for ledger ${ledger.name}`
  });

  return mapLedger(ledger);
}

async function updateLedger(companyId, fiscalYearId, ledgerId, payload) {
  const ledger = await Ledger.findOne({ _id: ledgerId, companyId, fiscalYearId });

  if (!ledger) {
    throw new ApiError(404, "Ledger was not found.");
  }

  if (ledger.isSystem) {
    throw new ApiError(403, "System ledgers cannot be edited.");
  }

  ledger.name = payload.name ? payload.name.trim() : ledger.name;
  ledger.code = payload.code !== undefined ? (payload.code ? payload.code.trim() : null) : ledger.code;
  ledger.accountGroup = payload.accountGroup || ledger.accountGroup;
  ledger.description =
    payload.description !== undefined
      ? payload.description
        ? payload.description.trim()
        : null
      : ledger.description;
  await ledger.save();

  return mapLedger(ledger);
}

async function archiveLedger(companyId, fiscalYearId, ledgerId) {
  const ledger = await Ledger.findOne({ _id: ledgerId, companyId, fiscalYearId });

  if (!ledger) {
    throw new ApiError(404, "Ledger was not found.");
  }

  if (ledger.isSystem) {
    throw new ApiError(403, "System ledgers cannot be archived.");
  }

  ledger.isActive = false;
  await ledger.save();

  return mapLedger(ledger);
}

async function getGeneralLedger(companyId, fiscalYearId, ledgerId, query = {}) {
  const ledger = await Ledger.findOne({ _id: ledgerId, companyId, fiscalYearId }).lean();

  if (!ledger) {
    throw new ApiError(404, "Ledger was not found.");
  }

  const lineFilters = {
    companyId,
    fiscalYearId,
    ledgerId
  };

  const lines = await JournalLine.find(lineFilters)
    .populate("journalEntryId")
    .sort({ createdAt: 1 })
    .lean();

  const openingSignedBalance = normalizeSignedBalance(
    ledger.openingBalance,
    ledger.openingBalanceType
  );

  let runningBalance = openingSignedBalance;

  const entries = lines
    .filter((line) => {
      const entry = line.journalEntryId;

      if (!entry) {
        return false;
      }

      if (entry.sourceType === "OPENING_BALANCE") {
        return false;
      }

      if (query.dateFrom && new Date(entry.date) < new Date(query.dateFrom)) {
        return false;
      }

      if (query.dateTo && new Date(entry.date) > new Date(query.dateTo)) {
        return false;
      }

      return true;
    })
    .map((line) => {
      runningBalance += line.debit - line.credit;

      return {
        id: line._id,
        voucherNumber: line.journalEntryId.voucherNumber,
        voucherDate: line.journalEntryId.date,
        narration: line.journalEntryId.narration,
        debit: line.debit,
        credit: line.credit,
        remarks: line.remarks,
        runningBalance: Math.abs(runningBalance),
        runningBalanceType: balanceTypeFromSignedAmount(runningBalance)
      };
    });

  return {
    ledger: mapLedger(ledger),
    openingBalance: ledger.openingBalance,
    openingBalanceType: ledger.openingBalanceType,
    entries,
    closingBalance: Math.abs(runningBalance),
    closingBalanceType: balanceTypeFromSignedAmount(runningBalance)
  };
}

async function getTrialBalance(companyId, fiscalYearId) {
  const ledgers = await Ledger.find({ companyId, fiscalYearId, isActive: true }).lean();
  const ledgerIds = ledgers.map((ledger) => ledger._id);
  const nonOpeningEntries = await require("../models/JournalEntry").JournalEntry.find({
    companyId,
    fiscalYearId,
    sourceType: { $ne: "OPENING_BALANCE" }
  }).lean();
  const lines = await JournalLine.find({
    companyId,
    fiscalYearId,
    ledgerId: { $in: ledgerIds },
    journalEntryId: { $in: nonOpeningEntries.map((entry) => entry._id) }
  }).lean();

  const rows = ledgers.map((ledger) => {
    const journalTotal = lines
      .filter((line) => String(line.ledgerId) === String(ledger._id))
      .reduce(
        (totals, line) => {
          totals.debit += line.debit;
          totals.credit += line.credit;
          return totals;
        },
        { debit: 0, credit: 0 }
      );

    const signedOpening = normalizeSignedBalance(
      ledger.openingBalance,
      ledger.openingBalanceType
    );
    const signedClosing = signedOpening + journalTotal.debit - journalTotal.credit;

    return {
      ledgerId: ledger._id,
      ledgerName: ledger.name,
      debit: signedClosing > 0 ? signedClosing : 0,
      credit: signedClosing < 0 ? Math.abs(signedClosing) : 0
    };
  });

  const totals = rows.reduce(
    (accumulator, row) => {
      accumulator.debit += row.debit;
      accumulator.credit += row.credit;
      return accumulator;
    },
    { debit: 0, credit: 0 }
  );

  return {
    rows,
    totals,
    isBalanced: totals.debit === totals.credit
  };
}

module.exports = {
  listAccountGroups,
  listLedgers,
  createLedger,
  updateLedger,
  archiveLedger,
  getGeneralLedger,
  getTrialBalance,
  mapLedger
};
