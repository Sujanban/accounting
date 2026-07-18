const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const voucherSequenceSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    type: {
      type: String,
      enum: ["JV", "SV", "PV", "RV", "PMV", "CV"],
      required: true
    },
    currentNumber: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

applySoftDeleteFields(voucherSequenceSchema);
applyAuditFields(voucherSequenceSchema);

voucherSequenceSchema.index({ companyId: 1, type: 1 }, { unique: true });

module.exports = {
  VoucherSequence: mongoose.model("VoucherSequence", voucherSequenceSchema)
};
