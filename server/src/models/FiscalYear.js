const mongoose = require("mongoose");

const fiscalYearSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    startDateBS: {
      type: String,
      required: true,
      trim: true
    },
    endDateBS: {
      type: String,
      required: true,
      trim: true
    },
    startDateAD: {
      type: Date,
      default: null
    },
    endDateAD: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isLocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

fiscalYearSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = {
  FiscalYear: mongoose.model("FiscalYear", fiscalYearSchema)
};
