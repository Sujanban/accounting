const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

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
    systemCode: {
      type: String,
      trim: true,
      default: null
    },
    category: {
      type: String,
      enum: ["Assets", "Liabilities", "Equity", "Income", "Expenses"],
      required: true
    },
    type: {
      type: String,
      enum: ["Assets", "Liabilities", "Equity", "Income", "Expenses"],
      default: null
    },
    parentId: {
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

applySoftDeleteFields(accountGroupSchema);
applyAuditFields(accountGroupSchema);

accountGroupSchema.index({ companyId: 1, name: 1 }, { unique: true });
accountGroupSchema.index({ companyId: 1, parentId: 1 });
accountGroupSchema.index(
  { companyId: 1, systemCode: 1 },
  {
    unique: true,
    partialFilterExpression: { systemCode: { $type: "string" } }
  }
);

module.exports = {
  AccountGroup: mongoose.model("AccountGroup", accountGroupSchema)
};
