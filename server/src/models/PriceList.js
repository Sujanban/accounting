const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const schema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: null },
  currency: { type: String, required: true, trim: true, uppercase: true, default: "NPR" },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
applySoftDeleteFields(schema); applyAuditFields(schema);
schema.index({ companyId: 1, name: 1 }, { unique: true });
schema.index({ companyId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });
module.exports = { PriceList: mongoose.model("PriceList", schema) };
