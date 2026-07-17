const mongoose = require("mongoose");

const accountGroupSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ["Assets", "Liabilities", "Equity", "Income", "Expenses"],
      required: true
    },
    parentGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountGroup",
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: null
    },
    isSystem: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

accountGroupSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = {
  AccountGroup: mongoose.model("AccountGroup", accountGroupSchema)
};
