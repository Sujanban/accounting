const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const branchSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  branchCode: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true, default: null },
  phone: { type: String, trim: true, default: null },
  email: { type: String, trim: true, lowercase: true, default: null },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
applySoftDeleteFields(branchSchema); applyAuditFields(branchSchema);
branchSchema.index({ companyId: 1, branchCode: 1 }, { unique: true });
branchSchema.index({ companyId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });
module.exports = { Branch: mongoose.model("Branch", branchSchema) };
