const { v2: cloudinary } = require("cloudinary");
const { Attachment } = require("../models/Attachment");
const { Contact } = require("../models/Contact");
const { Product } = require("../models/Product");
const { ApiError } = require("../utils/apiError");
const { env } = require("../config/env");

function configured() {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

function configureCloudinary() {
  if (!configured()) throw new ApiError(503, "File uploads are not configured.");
  cloudinary.config({ cloud_name: env.cloudinaryCloudName, api_key: env.cloudinaryApiKey, api_secret: env.cloudinaryApiSecret, secure: true });
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(options, (error, result) => error ? reject(error) : resolve(result)).end(buffer);
  });
}

const attachmentEntities = { contact: Contact, product: Product };

async function assertAttachmentEntity(companyId, entityType, entityId) {
  const Model = attachmentEntities[entityType];
  if (!Model) throw new ApiError(422, "Attachments can only be added to contacts or products.");
  const entity = await Model.findOne({ _id: entityId, companyId }).select("_id").lean();
  if (!entity) throw new ApiError(404, "Attachment owner was not found.");
}

function deliveryUrl(attachment) {
  // Existing records were stored as public Cloudinary assets. Preserve their
  // delivery until they can be migrated; new uploads intentionally have no URL.
  if (attachment.url) return attachment.url;
  if (!configured()) return null;
  const options = {
    resource_type: attachment.resourceType || (attachment.mimeType === "application/pdf" ? "raw" : "image"),
    type: "authenticated",
    sign_url: true,
    secure: true
  };
  // Attachments uploaded before resource metadata was persisted still need an
  // explicit PDF format for authenticated raw delivery.
  if (attachment.format || attachment.mimeType === "application/pdf") options.format = attachment.format || "pdf";
  return cloudinary.url(attachment.storageKey, options);
}

async function createAttachment(companyId, actorUserId, file, entityType, entityId) {
  if (!file) throw new ApiError(400, "A file is required.");
  if (!entityType || !entityId) throw new ApiError(400, "Attachment entity type and ID are required.");
  await assertAttachmentEntity(companyId, entityType, entityId);
  configureCloudinary();
  const result = await uploadBuffer(file.buffer, {
    folder: `ledgerly/${companyId}/${entityType}`,
    resource_type: "auto",
    type: "authenticated",
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    overwrite: false
  });
  const attachment = await Attachment.create({
    companyId, entityType, entityId, fileName: file.originalname, mimeType: file.mimetype,
    sizeBytes: file.size, storageKey: result.public_id, resourceType: result.resource_type, format: result.format || null, url: null, createdBy: actorUserId, updatedBy: actorUserId
  });
  return { id: attachment._id, entityType: attachment.entityType, entityId: attachment.entityId, fileName: attachment.fileName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes, storageKey: attachment.storageKey, url: deliveryUrl(attachment), createdAt: attachment.createdAt };
}

async function listAttachments(companyId, entityType, entityId) {
  if (!entityType || !entityId) throw new ApiError(400, "Attachment entity type and ID are required.");
  await assertAttachmentEntity(companyId, entityType, entityId);
  const filters = { companyId, isActive: true };
  filters.entityType = entityType;
  filters.entityId = entityId;
  const attachments = await Attachment.find(filters).sort({ createdAt: -1 }).lean();
  if (configured()) configureCloudinary();
  return attachments.map((attachment) => ({
    id: attachment._id, entityType: attachment.entityType, entityId: attachment.entityId,
    fileName: attachment.fileName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes,
    storageKey: attachment.storageKey,
    url: deliveryUrl(attachment),
    createdAt: attachment.createdAt
  }));
}

async function archiveAttachment(companyId, actorUserId, attachmentId) {
  const attachment = await Attachment.findOne({ _id: attachmentId, companyId, isActive: true });
  if (!attachment) throw new ApiError(404, "Attachment was not found.");
  attachment.isActive = false;
  attachment.deletedAt = new Date();
  attachment.deletedBy = actorUserId;
  attachment.updatedBy = actorUserId;
  await attachment.save();
}

async function getAttachmentDownload(companyId, attachmentId) {
  const attachment = await Attachment.findOne({ _id: attachmentId, companyId, isActive: true }).lean();
  if (!attachment) throw new ApiError(404, "Attachment was not found.");
  return { url: deliveryUrl(attachment), fileName: attachment.fileName };
}

module.exports = { createAttachment, listAttachments, archiveAttachment, getAttachmentDownload };
