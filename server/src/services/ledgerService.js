const { AccountGroup } = require("../models/AccountGroup");
const { Ledger } = require("../models/Ledger");
const { ApiError } = require("../utils/apiError");
const { assertFiscalYearWritable } = require("./fiscalYearGuardService");

function mapLedger(ledger) {
  return {
    id: ledger._id,
    companyId: ledger.companyId,
    groupId: ledger.groupId,
    fiscalYearId: ledger.fiscalYearId,
    systemCode: ledger.systemCode,
    name: ledger.name,
    openingBalance: ledger.openingBalance,
    openingBalanceType: ledger.openingBalanceType,
    description: ledger.description,
    allowManualEntry: ledger.allowManualEntry,
    isSystem: ledger.isSystem,
    isActive: ledger.isActive,
    createdAt: ledger.createdAt
  };
}

async function resolveGroup(companyId, groupId) {
  const group = await AccountGroup.findOne({
    _id: groupId,
    companyId,
    isActive: true
  }).lean();

  if (!group) {
    throw new ApiError(400, "A valid account group is required.");
  }

  return group;
}

async function listLedgers(companyId, fiscalYearId, query = {}) {
  const filters = { companyId, fiscalYearId };

  if (query.search) {
    filters.name = { $regex: query.search, $options: "i" };
  }

  if (query.groupId) {
    filters.groupId = query.groupId;
  }

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === "true";
  }

  const ledgers = await Ledger.find(filters).sort({ name: 1 }).lean();
  return ledgers.map(mapLedger);
}

async function createLedger(companyId, fiscalYearId, payload) {
  await assertFiscalYearWritable(companyId, fiscalYearId);
  const group = await resolveGroup(companyId, payload.groupId);

  const ledger = await Ledger.create({
    companyId,
    groupId: group._id,
    fiscalYearId,
    systemCode: payload.systemCode ? payload.systemCode.trim() : null,
    name: payload.name.trim(),
    openingBalance: Number(payload.openingBalance || 0),
    openingBalanceType: payload.openingBalanceType || "DEBIT",
    description: payload.description ? payload.description.trim() : null,
    allowManualEntry:
      payload.allowManualEntry !== undefined ? payload.allowManualEntry : true,
    isSystem: false,
    isActive: true,
    createdBy: payload.actorUserId || null,
    updatedBy: payload.actorUserId || null
  });

  return mapLedger(ledger);
}

async function updateLedger(companyId, fiscalYearId, ledgerId, payload) {
  await assertFiscalYearWritable(companyId, fiscalYearId);

  const ledger = await Ledger.findOne({
    _id: ledgerId,
    companyId,
    fiscalYearId
  });

  if (!ledger) {
    throw new ApiError(404, "Ledger was not found.");
  }

  if (ledger.isSystem) {
    throw new ApiError(403, "System ledgers cannot be edited.");
  }

  if (payload.name) {
    ledger.name = payload.name.trim();
  }

  if (payload.groupId) {
    const group = await resolveGroup(companyId, payload.groupId);
    ledger.groupId = group._id;
  }

  if (payload.openingBalance !== undefined) {
    ledger.openingBalance = Number(payload.openingBalance);
  }

  if (payload.openingBalanceType !== undefined) {
    ledger.openingBalanceType = payload.openingBalanceType;
  }

  if (payload.description !== undefined) {
    ledger.description = payload.description ? payload.description.trim() : null;
  }

  if (payload.allowManualEntry !== undefined) {
    ledger.allowManualEntry = payload.allowManualEntry;
  }

  ledger.updatedBy = payload.actorUserId || ledger.updatedBy || null;
  await ledger.save();

  return mapLedger(ledger);
}

async function archiveLedger(companyId, fiscalYearId, ledgerId, actorUserId = null) {
  await assertFiscalYearWritable(companyId, fiscalYearId);

  const ledger = await Ledger.findOne({
    _id: ledgerId,
    companyId,
    fiscalYearId
  });

  if (!ledger) {
    throw new ApiError(404, "Ledger was not found.");
  }

  if (ledger.isSystem) {
    throw new ApiError(403, "System ledgers cannot be archived.");
  }

  ledger.isActive = false;
  ledger.deletedAt = new Date();
  ledger.deletedBy = actorUserId;
  ledger.updatedBy = actorUserId || ledger.updatedBy || null;
  await ledger.save();

  return mapLedger(ledger);
}

module.exports = {
  listLedgers,
  createLedger,
  updateLedger,
  archiveLedger,
  mapLedger
};
