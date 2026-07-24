const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { createAttachment, listAttachments, archiveAttachment, getAttachmentDownload: createAttachmentDownload } = require("../services/attachmentService");

const postAttachmentUpload = asyncHandler(async (request, response) => {
  const data = await createAttachment(request.auth.activeCompanyId, request.auth.user._id, request.file, request.body.entityType, request.body.entityId);
  return sendSuccess(response, 201, "Attachment uploaded successfully.", data);
});
const getAttachments = asyncHandler(async (request, response) => sendSuccess(response, 200, "Attachments fetched successfully.", await listAttachments(request.auth.activeCompanyId, request.query.entityType, request.query.entityId)));
const deleteAttachment = asyncHandler(async (request, response) => {
  await archiveAttachment(request.auth.activeCompanyId, request.auth.user._id, request.params.id);
  return response.status(204).send();
});
const getAttachmentDownload = asyncHandler(async (request, response) => sendSuccess(response, 200, "Attachment download URL created successfully.", await createAttachmentDownload(request.auth.activeCompanyId, request.params.id)));

module.exports = { postAttachmentUpload, getAttachments, deleteAttachment, getAttachmentDownload };
