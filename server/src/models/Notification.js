const mongoose = require("mongoose");
const { applyAuditFields } = require("./schemaHelpers");

const notificationSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true, trim: true, maxlength: 80 },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  resourcePath: { type: String, trim: true, maxlength: 500, default: null },
  readAt: { type: Date, default: null },
}, { timestamps: true });
notificationSchema.index({ companyId: 1, userId: 1, readAt: 1, createdAt: -1, _id: -1 });
applyAuditFields(notificationSchema);
module.exports = { Notification: mongoose.model("Notification", notificationSchema) };
