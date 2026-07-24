const mongoose = require("mongoose");
const { Contact } = require("../models/Contact");
const { ContactLedger } = require("../models/ContactLedger");
const { Ledger } = require("../models/Ledger");
const { ApiError } = require("../utils/apiError");

function mapContactLedger(mapping) {
  return {
    id: mapping._id,
    contactId: mapping.contactId,
    fiscalYearId: mapping.fiscalYearId,
    role: mapping.role,
    ledgerId: mapping.ledgerId,
    createdAt: mapping.createdAt
  };
}

async function createContactLedgerMapping(companyId, fiscalYearId, contactId, payload) {
  if (!mongoose.isObjectIdOrHexString(contactId)) throw new ApiError(400, "Contact must be a valid identifier.");
  const [contact, ledger] = await Promise.all([
    Contact.findOne({ _id: contactId, companyId, isActive: true }).lean(),
    Ledger.findOne({ _id: payload.ledgerId, companyId, fiscalYearId, isActive: true }).lean()
  ]);
  if (!contact) throw new ApiError(404, "Contact was not found.");
  if (!contact.roles.includes(payload.role)) throw new ApiError(422, "The contact does not have the selected statement role.");
  if (!ledger) throw new ApiError(422, "Ledger must be active and belong to the active fiscal year.");

  const existing = await ContactLedger.findOne({ companyId, contactId, fiscalYearId, role: payload.role }).lean();
  if (existing) throw new ApiError(409, "A ledger mapping already exists for this contact, fiscal year, and role.");
  const ledgerInUse = await ContactLedger.findOne({ companyId, fiscalYearId, ledgerId: ledger._id }).lean();
  if (ledgerInUse) throw new ApiError(409, "This ledger is already mapped to another contact statement.");

  const mapping = await ContactLedger.create({
    companyId,
    contactId,
    fiscalYearId,
    role: payload.role,
    ledgerId: ledger._id,
    createdBy: payload.actorUserId,
    updatedBy: payload.actorUserId
  });
  return mapContactLedger(mapping);
}

async function listContactLedgerMappings(companyId, fiscalYearId, contactId) {
  if (!mongoose.isObjectIdOrHexString(contactId)) throw new ApiError(400, "Contact must be a valid identifier.");
  const contact = await Contact.findOne({ _id: contactId, companyId }).lean();
  if (!contact) throw new ApiError(404, "Contact was not found.");
  const mappings = await ContactLedger.find({ companyId, contactId, fiscalYearId }).sort({ role: 1 }).lean();
  return mappings.map(mapContactLedger);
}

module.exports = { createContactLedgerMapping, listContactLedgerMappings };
