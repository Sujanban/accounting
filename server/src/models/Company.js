const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    panNumber: {
      type: String,
      required: true,
      trim: true
    },
    vatRegistered: {
      type: Boolean,
      default: false
    },
    vatNumber: {
      type: String,
      trim: true,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: null
    },
    logo: {
      type: String,
      trim: true,
      default: null
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    activeFiscalYear: {
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
      }
    },
    activeFiscalYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FiscalYear",
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

applySoftDeleteFields(companySchema);
applyAuditFields(companySchema);

companySchema.index({ panNumber: 1 }, { unique: true });
companySchema.index(
  { vatNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { vatRegistered: true, vatNumber: { $type: "string" } }
  }
);

module.exports = {
  Company: mongoose.model("Company", companySchema)
};
