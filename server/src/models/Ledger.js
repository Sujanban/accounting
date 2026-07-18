const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const ledgerSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountGroup",
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
    systemCode: {
      type: String,
      trim: true,
      default: null
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
    allowManualEntry: {
      type: Boolean,
      default: true
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

applySoftDeleteFields(ledgerSchema);
applyAuditFields(ledgerSchema);

ledgerSchema.index({ companyId: 1, name: 1 }, { unique: true });
ledgerSchema.index({ companyId: 1, fiscalYearId: 1, groupId: 1 });
ledgerSchema.index(
  { companyId: 1, fiscalYearId: 1, systemCode: 1 },
  {
    unique: true,
    partialFilterExpression: { systemCode: { $type: "string" } }
  }
);

module.exports = {
  Ledger: mongoose.model("Ledger", ledgerSchema)
};
