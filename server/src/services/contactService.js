const { Contact } = require("../models/Contact");
const { ContactGroup } = require("../models/ContactGroup");
const { ApiError } = require("../utils/apiError");

const MAX_LIMIT = 100;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getPage(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit };
}

function mapContact(contact) {
  return {
    id: contact._id,
    companyId: contact.companyId,
    contactCode: contact.contactCode,
    name: contact.name,
    displayName: contact.displayName,
    roles: contact.roles,
    contactGroupId: contact.contactGroupId,
    panNumber: contact.panNumber,
    vatNumber: contact.vatNumber,
    phone: contact.phone,
    mobile: contact.mobile,
    email: contact.email,
    website: contact.website,
    billingAddress: contact.billingAddress,
    shippingAddress: contact.shippingAddress,
    creditLimit: contact.creditLimit,
    paymentTermId: contact.paymentTermId,
    ledgerId: contact.ledgerId,
    notes: contact.notes,
    isActive: contact.isActive,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    deletedAt: contact.deletedAt,
    deletedBy: contact.deletedBy
  };
}

async function assertContactGroup(companyId, groupId) {
  if (!groupId) return null;
  const group = await ContactGroup.findOne({ _id: groupId, companyId, isActive: true }).lean();
  if (!group) throw new ApiError(400, "A valid active contact group is required.");
  return group;
}

async function listContacts(companyId, query = {}) {
  const { page, limit } = getPage(query);
  const filters = { companyId, isActive: query.isActive === "false" ? false : true };
  if (query.role) filters.roles = query.role;
  if (query.contactGroupId) filters.contactGroupId = query.contactGroupId;
  if (query.search) {
    const search = new RegExp(escapeRegex(String(query.search).slice(0, 100)), "i");
    filters.$or = [{ name: search }, { displayName: search }, { contactCode: search }, { phone: search }, { mobile: search }];
  }
  const [contacts, total] = await Promise.all([
    Contact.find(filters).sort({ name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Contact.countDocuments(filters)
  ]);
  return { data: contacts.map(mapContact), meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } };
}

async function createContact(companyId, payload) {
  await assertContactGroup(companyId, payload.contactGroupId);
  const contact = await Contact.create({
    ...payload,
    companyId,
    contactCode: payload.contactCode.trim().toUpperCase(),
    name: payload.name.trim(),
    displayName: payload.displayName ? payload.displayName.trim() : null,
    email: payload.email ? payload.email.trim().toLowerCase() : null,
    creditLimit: payload.creditLimit === undefined ? 0 : Number(payload.creditLimit),
    createdBy: payload.actorUserId,
    updatedBy: payload.actorUserId
  });
  return mapContact(contact);
}

async function updateContact(companyId, contactId, payload) {
  const contact = await Contact.findOne({ _id: contactId, companyId });
  if (!contact) throw new ApiError(404, "Contact was not found.");
  if (payload.contactGroupId !== undefined) await assertContactGroup(companyId, payload.contactGroupId);
  for (const field of ["name", "displayName", "roles", "contactGroupId", "panNumber", "vatNumber", "phone", "mobile", "email", "website", "billingAddress", "shippingAddress", "paymentTermId", "notes"]) {
    if (payload[field] !== undefined) contact[field] = payload[field];
  }
  if (payload.name) contact.name = payload.name.trim();
  if (payload.displayName !== undefined) contact.displayName = payload.displayName ? payload.displayName.trim() : null;
  if (payload.email !== undefined) contact.email = payload.email ? payload.email.trim().toLowerCase() : null;
  if (payload.creditLimit !== undefined) contact.creditLimit = Number(payload.creditLimit);
  contact.updatedBy = payload.actorUserId;
  await contact.save();
  return mapContact(contact);
}

async function archiveContact(companyId, contactId, actorUserId) {
  const contact = await Contact.findOne({ _id: contactId, companyId });
  if (!contact) throw new ApiError(404, "Contact was not found.");
  contact.isActive = false; contact.deletedAt = new Date(); contact.deletedBy = actorUserId; contact.updatedBy = actorUserId;
  await contact.save();
  return mapContact(contact);
}

module.exports = { listContacts, createContact, updateContact, archiveContact };
