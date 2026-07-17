const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true,
      default: null
    },
    accountGroup: {
      type: String,
      enum: [
        "Current Assets",
        "Fixed Assets",
        "Investments",
        "Current Liabilities",
        "Long-term Liabilities",
        "Capital Account",
        "Retained Earnings",
        "Direct Income",
        "Indirect Income",
        "Direct Expenses",
        "Indirect Expenses"
      ],
      required: true
    },
    parentLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ledger",
      default: null
    },
    openingBalance: {
      type: Number,
      default: 0
    },
    openingBalanceType: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      default: "DEBIT"
    },
    description: {
      type: String,
      trim: true,
      default: null
    },
    sourceType: {
      type: String,
      enum: ["GENERAL", "CUSTOMER", "SUPPLIER", "SYSTEM"],
      default: "GENERAL"
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
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

ledgerSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = {
  Ledger: mongoose.model("Ledger", ledgerSchema)
};
