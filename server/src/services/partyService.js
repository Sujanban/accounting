const { Customer } = require("../models/Customer");
const { Ledger } = require("../models/Ledger");
const { Supplier } = require("../models/Supplier");
const { ApiError } = require("../utils/apiError");
const { createOpeningBalanceJournal } = require("./journalService");

function mapParty(record) {
  return {
    id: record._id,
    companyId: record.companyId,
    fiscalYearId: record.fiscalYearId,
    ledgerId: record.ledgerId,
    name: record.name,
    phone: record.phone,
    email: record.email,
    panNumber: record.panNumber,
    address: record.address,
    openingBalance: record.openingBalance,
    openingBalanceType: record.openingBalanceType,
    isActive: record.isActive,
    createdAt: record.createdAt
  };
}

async function createParty({
  model,
  sourceType,
  ledgerGroup,
  defaultOpeningBalanceType,
  companyId,
  fiscalYearId,
  payload
}) {
  const ledger = await Ledger.create({
    companyId,
    fiscalYearId,
    name: payload.name.trim(),
    accountGroup: ledgerGroup,
    openingBalance: Number(payload.openingBalance || 0),
    openingBalanceType: payload.openingBalanceType || defaultOpeningBalanceType,
    description: payload.address ? payload.address.trim() : null,
    sourceType,
    isSystem: false,
    isActive: true
  });

  const record = await model.create({
    companyId,
    fiscalYearId,
    ledgerId: ledger._id,
    name: payload.name.trim(),
    phone: payload.phone ? payload.phone.trim() : null,
    email: payload.email ? payload.email.trim().toLowerCase() : null,
    panNumber: payload.panNumber ? payload.panNumber.trim() : null,
    address: payload.address ? payload.address.trim() : null,
    openingBalance: Number(payload.openingBalance || 0),
    openingBalanceType: payload.openingBalanceType || defaultOpeningBalanceType,
    isActive: true
  });

  ledger.sourceId = record._id;
  await ledger.save();

  await createOpeningBalanceJournal({
    companyId,
    fiscalYearId,
    ledgerId: ledger._id,
    amount: record.openingBalance,
    balanceType: record.openingBalanceType,
    narration: `Opening balance for ${sourceType.toLowerCase()} ${record.name}`
  });

  return mapParty(record);
}

async function updateParty({ model, companyId, fiscalYearId, partyId, payload }) {
  const record = await model.findOne({ _id: partyId, companyId, fiscalYearId });

  if (!record) {
    throw new ApiError(404, "Record was not found.");
  }

  record.name = payload.name ? payload.name.trim() : record.name;
  record.phone = payload.phone !== undefined ? (payload.phone ? payload.phone.trim() : null) : record.phone;
  record.email =
    payload.email !== undefined
      ? payload.email
        ? payload.email.trim().toLowerCase()
        : null
      : record.email;
  record.panNumber =
    payload.panNumber !== undefined
      ? payload.panNumber
        ? payload.panNumber.trim()
        : null
      : record.panNumber;
  record.address =
    payload.address !== undefined
      ? payload.address
        ? payload.address.trim()
        : null
      : record.address;
  await record.save();

  await Ledger.findByIdAndUpdate(record.ledgerId, {
    name: record.name,
    description: record.address
  });

  return mapParty(record);
}

async function archiveParty({ model, companyId, fiscalYearId, partyId }) {
  const record = await model.findOne({ _id: partyId, companyId, fiscalYearId });

  if (!record) {
    throw new ApiError(404, "Record was not found.");
  }

  record.isActive = false;
  await record.save();
  await Ledger.findByIdAndUpdate(record.ledgerId, { isActive: false });

  return mapParty(record);
}

async function listParties(model, companyId, fiscalYearId, query = {}) {
  const filters = { companyId, fiscalYearId };

  if (query.search) {
    filters.name = { $regex: query.search, $options: "i" };
  }

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === "true";
  }

  const records = await model.find(filters).sort({ name: 1 }).lean();
  return records.map(mapParty);
}

module.exports = {
  createParty,
  updateParty,
  archiveParty,
  listParties,
  mapParty
};
