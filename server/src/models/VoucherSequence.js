const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const voucherSequenceSchema = new mongoose.Schema(
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
      enum: ["JV", "SV", "PV", "RV", "PMV", "CV"],
      required: true
    },
    prefix: {
      type: String,
      required: true,
      trim: true
    },
    nextNumber: {
      type: Number,
      default: 1,
      min: 1
    },
    padding: {
      type: Number,
      default: 6,
      min: 1,
      max: 12
    },
    resetEveryFiscalYear: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

applySoftDeleteFields(voucherSequenceSchema);
applyAuditFields(voucherSequenceSchema);

voucherSequenceSchema.index(
  { companyId: 1, fiscalYearId: 1, voucherType: 1 },
  { unique: true }
);

module.exports = {
  VoucherSequence: mongoose.model("VoucherSequence", voucherSequenceSchema)
};
