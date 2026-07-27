const mongoose = require("mongoose");
const { applyAuditFields } = require("./schemaHelpers");

const salesOrderSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", required: true },
  orderNumber: { type: String, required: true, immutable: true },
  orderDate: { type: Date, required: true },
  items: { type: [{ productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }, quantity: { type: Number, required: true, min: 0.000001 }, unitPrice: { type: Number, required: true, min: 0 } }], required: true },
  notes: { type: String, trim: true, maxlength: 2000, default: null },
  status: { type: String, enum: ["DRAFT", "CONFIRMED", "CANCELLED"], default: "DRAFT" }
}, { timestamps: true });
salesOrderSchema.index({ companyId: 1, orderNumber: 1 }, { unique: true });
salesOrderSchema.index({ companyId: 1, branchId: 1, status: 1, orderDate: -1, _id: -1 });
applyAuditFields(salesOrderSchema);
module.exports = { SalesOrder: mongoose.model("SalesOrder", salesOrderSchema) };
