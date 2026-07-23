const { v2: cloudinary } = require("cloudinary");
const { Attachment } = require("../models/Attachment");
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

async function createAttachment(companyId, actorUserId, file, entityType, entityId) {
  if (!file) throw new ApiError(400, "A file is required.");
  if (!entityType || !entityId) throw new ApiError(400, "Attachment entity type and ID are required.");
  configureCloudinary();
  const result = await uploadBuffer(file.buffer, {
    folder: `ledgerly/${companyId}/${entityType}`,
    resource_type: "auto",
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    overwrite: false
  });
  const attachment = await Attachment.create({
    companyId, entityType, entityId, fileName: file.originalname, mimeType: file.mimetype,
    sizeBytes: file.size, storageKey: result.public_id, url: result.secure_url, createdBy: actorUserId, updatedBy: actorUserId
  });
  return { id: attachment._id, entityType: attachment.entityType, entityId: attachment.entityId, fileName: attachment.fileName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes, storageKey: attachment.storageKey, url: attachment.url, createdAt: attachment.createdAt };
}

async function listAttachments(companyId, entityType, entityId) {
  const filters = { companyId, isActive: true };
  if (entityType) filters.entityType = entityType;
  if (entityId) filters.entityId = entityId;
  const attachments = await Attachment.find(filters).sort({ createdAt: -1 }).lean();
  if (configured()) configureCloudinary();
  return attachments.map((attachment) => ({
    id: attachment._id, entityType: attachment.entityType, entityId: attachment.entityId,
    fileName: attachment.fileName, mimeType: attachment.mimeType, sizeBytes: attachment.sizeBytes,
    storageKey: attachment.storageKey,
    url: attachment.url || (configured() ? cloudinary.url(attachment.storageKey, { resource_type: attachment.mimeType === "application/pdf" ? "raw" : "image", secure: true }) : null),
    createdAt: attachment.createdAt
  }));
}

module.exports = { createAttachment, listAttachments };
