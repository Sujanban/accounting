const mongoose = require("mongoose");
const { applyAuditFields } = require("./schemaHelpers");

const inventoryMovementSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    fiscalYearId: { type: mongoose.Schema.Types.ObjectId, ref: "FiscalYear", required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    movementType: { type: String, required: true },
    direction: { type: String, enum: ["IN", "OUT"], required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, min: 0, default: 0 },
    transactionDate: { type: Date, required: true }
  },
  { timestamps: true }
);
applyAuditFields(inventoryMovementSchema);
inventoryMovementSchema.index({ companyId: 1, productId: 1, warehouseId: 1, transactionDate: -1 });

module.exports = { InventoryMovement: mongoose.model("InventoryMovement", inventoryMovementSchema) };
