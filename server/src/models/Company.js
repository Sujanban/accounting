const mongoose = require("mongoose");

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
      }
    },
    activeFiscalYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FiscalYear",
      default: null
    },
    businessType: {
      type: String,
      enum: [
        "Retail Shop",
        "Wholesale",
        "Service Business",
        "Manufacturing",
        "Pharmacy",
        "Restaurant",
        "Other"
      ],
      required: true
    },
    defaultSetup: {
      chartOfAccounts: {
        type: [String],
        default: [
          "Cash",
          "Bank",
          "Inventory",
          "Accounts Payable",
          "Sales",
          "Rent",
          "Salary",
          "Utilities"
        ]
      },
      defaultCashAccount: {
        type: String,
        default: "Cash"
      },
      defaultInventoryAccount: {
        type: String,
        default: "Inventory"
      },
      defaultSalesAccount: {
        type: String,
        default: "Sales"
      }
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
