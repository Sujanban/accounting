const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const settingSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      unique: true
    },
    businessType: {
      type: String,
      enum: [
        "RETAIL",
        "WHOLESALE",
        "SERVICE",
        "MANUFACTURING",
        "PHARMACY",
        "RESTAURANT",
        "OTHER"
      ],
      required: true
    },
    currency: {
      type: String,
      default: "NPR",
      trim: true
    },
    currencySymbol: {
      type: String,
      default: "Rs.",
      trim: true
    },
    language: {
      type: String,
      default: "en",
      trim: true
    },
    dateFormat: {
      type: String,
      enum: ["BS", "AD"],
      default: "BS"
    },
    timezone: {
      type: String,
      default: "Asia/Kathmandu",
      trim: true
    },
    decimalPlaces: {
      type: Number,
      default: 2,
      min: 0,
      max: 6
    },
    allowNegativeStock: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

applySoftDeleteFields(settingSchema);
applyAuditFields(settingSchema);

module.exports = {
  Setting: mongoose.model("Setting", settingSchema)
};
