const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const schema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  entityType: { type: String, required: true, trim: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fileName: { type: String, required: true, trim: true },
  mimeType: { type: String, required: true, trim: true },
  sizeBytes: { type: Number, required: true, min: 0 },
  storageKey: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
applySoftDeleteFields(schema); applyAuditFields(schema);
schema.index({ companyId: 1, entityType: 1, entityId: 1, isActive: 1 });
module.exports = { Attachment: mongoose.model("Attachment", schema) };
