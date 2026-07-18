const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const journalEntrySchema = new mongoose.Schema(
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
    voucherType: {
      type: String,
      enum: ["JV"],
      default: "JV"
    },
    voucherNumber: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    narration: {
      type: String,
      trim: true,
      default: null
    },
    sourceType: {
      type: String,
      enum: ["MANUAL", "OPENING_BALANCE"],
      default: "MANUAL"
    },
    isPosted: {
      type: Boolean,
      default: true
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

applySoftDeleteFields(journalEntrySchema);
applyAuditFields(journalEntrySchema);

journalEntrySchema.index({ companyId: 1, voucherNumber: 1 }, { unique: true });

module.exports = {
  JournalEntry: mongoose.model("JournalEntry", journalEntrySchema)
};
