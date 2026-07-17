const mongoose = require("mongoose");

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

voucherSequenceSchema.index({ companyId: 1, type: 1 }, { unique: true });

module.exports = {
  VoucherSequence: mongoose.model("VoucherSequence", voucherSequenceSchema)
};
