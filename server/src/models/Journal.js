const mongoose = require("mongoose");
const { applyAuditFields } = require("./schemaHelpers");

const journalSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    fiscalYearId: { type: mongoose.Schema.Types.ObjectId, ref: "FiscalYear", required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction", required: true, unique: true },
    voucherNumber: { type: String, required: true, trim: true },
    transactionDate: { type: Date, required: true },
    narration: { type: String, trim: true, default: null },
    totalDebit: { type: Number, required: true, min: 0 },
    totalCredit: { type: Number, required: true, min: 0 },
    isReversal: { type: Boolean, default: false }
  },
  { timestamps: true }
);
applyAuditFields(journalSchema);
journalSchema.index({ companyId: 1, branchId: 1, fiscalYearId: 1, transactionDate: -1 });

const journalLineSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    journalId: { type: mongoose.Schema.Types.ObjectId, ref: "Journal", required: true },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: "Ledger", required: true },
    debit: { type: Number, min: 0, default: 0 },
    credit: { type: Number, min: 0, default: 0 },
    narration: { type: String, trim: true, default: null }
  },
  { timestamps: true }
);
applyAuditFields(journalLineSchema);
journalLineSchema.index({ companyId: 1, journalId: 1 });
journalLineSchema.index({ companyId: 1, ledgerId: 1 });

module.exports = { Journal: mongoose.model("Journal", journalSchema), JournalLine: mongoose.model("JournalLine", journalLineSchema) };
