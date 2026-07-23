const { listContacts, getContact: getContactById, createContact, updateContact, archiveContact, restoreContact } = require("../services/contactService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getContacts = asyncHandler(async (request, response) => {
  const result = await listContacts(request.auth.activeCompanyId, request.query);
  return sendSuccess(response, 200, "Contacts fetched successfully.", {
    items: result.data,
    meta: result.meta
  });
});

const getContact = asyncHandler(async (request, response) => {
  const data = await getContactById(request.auth.activeCompanyId, request.params.id);
  return sendSuccess(response, 200, "Contact fetched successfully.", data);
});

const postContact = asyncHandler(async (request, response) => {
  const data = await createContact(request.auth.activeCompanyId, { ...request.body, actorUserId: request.auth.user._id });
  return sendSuccess(response, 201, "Contact created successfully.", data);
});

const patchContact = asyncHandler(async (request, response) => {
  const data = await updateContact(request.auth.activeCompanyId, request.params.id, { ...request.body, actorUserId: request.auth.user._id });
  return sendSuccess(response, 200, "Contact updated successfully.", data);
});

const archiveContactRecord = asyncHandler(async (request, response) => {
  const data = await archiveContact(request.auth.activeCompanyId, request.params.id, request.auth.user._id);
  return sendSuccess(response, 200, "Contact archived successfully.", data);
});

const restoreContactRecord = asyncHandler(async (request, response) => {
  const data = await restoreContact(request.auth.activeCompanyId, request.params.id, request.auth.user._id);
  return sendSuccess(response, 200, "Contact restored successfully.", data);
});

module.exports = { getContacts, getContact, postContact, patchContact, archiveContactRecord, restoreContactRecord };
