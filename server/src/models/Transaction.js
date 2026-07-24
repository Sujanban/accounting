const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const accountingEntrySchema = new mongoose.Schema(
  {
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: "Ledger", required: true },
    debit: { type: Number, min: 0, default: 0 },
    credit: { type: Number, min: 0, default: 0 },
    narration: { type: String, trim: true, maxlength: 1000, default: null }
  },
  { _id: false }
);

const inventoryEntrySchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    quantity: { type: Number, required: true, min: 0 },
    direction: { type: String, enum: ["IN", "OUT"], required: true },
    unitCost: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    fiscalYearId: { type: mongoose.Schema.Types.ObjectId, ref: "FiscalYear", required: true },
    transactionType: { type: String, enum: ["JOURNAL", "RECEIPT", "PAYMENT", "CONTRA", "SALE", "PURCHASE", "EXPENSE", "OPENING_BALANCE", "INVENTORY_ADJUSTMENT", "STOCK_TRANSFER", "SALES_RETURN", "PURCHASE_RETURN", "DEBIT_NOTE", "CREDIT_NOTE"], required: true },
    voucherType: { type: String, enum: ["JV", "RV", "PMV", "CV", "SV", "PV"], required: true },
    voucherNumber: { type: String, default: null },
    transactionDate: { type: Date, required: true },
    referenceNo: { type: String, trim: true, maxlength: 100, default: null },
    narration: { type: String, trim: true, maxlength: 2000, default: null },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    accountingEntries: { type: [accountingEntrySchema], default: [] },
    inventoryEntries: { type: [inventoryEntrySchema], default: [] },
    status: { type: String, enum: ["DRAFT", "POSTED", "CANCELLED", "REVERSED"], default: "DRAFT" },
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal", default: null },
    reversalOfId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    reversedById: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", default: null },
    postedAt: { type: Date, default: null },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

applySoftDeleteFields(transactionSchema);
applyAuditFields(transactionSchema);
transactionSchema.index({ companyId: 1, transactionDate: -1, _id: -1 });
transactionSchema.index({ companyId: 1, fiscalYearId: 1, status: 1, transactionDate: -1, _id: -1 });
transactionSchema.index({ companyId: 1, fiscalYearId: 1, voucherNumber: 1 }, { unique: true, partialFilterExpression: { voucherNumber: { $type: "string" } } });
transactionSchema.index({ companyId: 1, status: 1, transactionType: 1 });

module.exports = { Transaction: mongoose.model("Transaction", transactionSchema) };
