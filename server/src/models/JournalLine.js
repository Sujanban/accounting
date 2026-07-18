const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const journalLineSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    fiscalYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FiscalYear",
      required: true
    },
    journalEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JournalEntry",
      required: true
    },
    ledgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ledger",
      required: true
    },
    debit: {
      type: Number,
      default: 0
    },
    credit: {
      type: Number,
      default: 0
    },
    remarks: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

applySoftDeleteFields(journalLineSchema);
applyAuditFields(journalLineSchema);

journalLineSchema.index({ companyId: 1, fiscalYearId: 1, ledgerId: 1 });
journalLineSchema.index({ journalEntryId: 1 });

module.exports = {
  JournalLine: mongoose.model("JournalLine", journalLineSchema)
};
