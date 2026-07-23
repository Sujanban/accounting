const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const warehouseSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    warehouseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: null },
    description: { type: String, trim: true, default: null },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
applySoftDeleteFields(warehouseSchema);
applyAuditFields(warehouseSchema);
warehouseSchema.index({ companyId: 1, warehouseCode: 1 }, { unique: true });
warehouseSchema.index(
  { companyId: 1, branchId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } },
);
module.exports = { Warehouse: mongoose.model("Warehouse", warehouseSchema) };
