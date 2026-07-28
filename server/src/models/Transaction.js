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

const taxDetailsSchema = new mongoose.Schema(
  {
    customerName: { type: String, trim: true, maxlength: 200, default: null },
    customerPan: { type: String, trim: true, match: /^\d{9}$/, default: null },
    taxableAmount: { type: Number, required: true, min: 0 },
    vatRate: { type: Number, required: true, min: 0, max: 100 },
    vatAmount: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    mode: { type: String, enum: ["EXCLUSIVE", "INCLUSIVE"], default: "EXCLUSIVE" }
  },
  { _id: false }
);

const taxInvoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, immutable: true },
    issuedAt: { type: Date, required: true, immutable: true },
    companyPan: { type: String, required: true, immutable: true },
    companyVatNumber: { type: String, required: true, immutable: true },
    customerName: { type: String, trim: true, maxlength: 200, default: null, immutable: true },
    customerPan: { type: String, trim: true, match: /^\d{9}$/, default: null, immutable: true },
    taxableAmount: { type: Number, required: true, min: 0, immutable: true },
    vatRate: { type: Number, required: true, min: 0, max: 100, immutable: true },
    vatAmount: { type: Number, required: true, min: 0, immutable: true },
    totalAmount: { type: Number, required: true, min: 0, immutable: true },
    mode: { type: String, enum: ["EXCLUSIVE", "INCLUSIVE"], required: true, immutable: true }
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", default: null },
    fiscalYearId: { type: mongoose.Schema.Types.ObjectId, ref: "FiscalYear", required: true },
    transactionType: { type: String, enum: ["JOURNAL", "RECEIPT", "PAYMENT", "CONTRA", "SALE", "PURCHASE", "INVENTORY_ADJUSTMENT", "STOCK_TRANSFER", "DELIVERY_NOTE", "RECEIPT_NOTE"], required: true },
    voucherType: { type: String, enum: ["JV", "RV", "PMV", "CV", "SV", "PV", "DN", "RN"], required: true },
    voucherNumber: { type: String, default: null },
    transactionDate: { type: Date, required: true },
    narration: { type: String, trim: true, maxlength: 2000, default: null },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    taxDetails: { type: taxDetailsSchema, default: null },
    taxInvoice: { type: taxInvoiceSchema, default: null },
    accountingEntries: { type: [accountingEntrySchema], default: [] },
    inventoryEntries: { type: [inventoryEntrySchema], default: [] },
    status: { type: String, enum: ["DRAFT", "SUBMITTED", "APPROVED", "POSTED", "CANCELLED", "REVERSED"], default: "DRAFT" },
    submittedAt: { type: Date, default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
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
transactionSchema.index({ companyId: 1, fiscalYearId: 1, "taxInvoice.number": 1 }, { unique: true, partialFilterExpression: { "taxInvoice.number": { $type: "string" } } });
transactionSchema.index({ companyId: 1, status: 1, transactionType: 1 });

module.exports = { Transaction: mongoose.model("Transaction", transactionSchema) };
