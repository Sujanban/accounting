const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const contactGroupSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000, default: null },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "ContactGroup", default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

applySoftDeleteFields(contactGroupSchema);
applyAuditFields(contactGroupSchema);
contactGroupSchema.index({ companyId: 1, name: 1 }, { unique: true });
contactGroupSchema.index({ companyId: 1, parentId: 1 });

module.exports = { ContactGroup: mongoose.model("ContactGroup", contactGroupSchema) };
