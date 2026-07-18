const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const productSchema = new mongoose.Schema(
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
    sku: {
      type: String,
      trim: true,
      default: null
    },
    category: {
      type: String,
      trim: true,
      default: null
    },
    unit: {
      type: String,
      required: true,
      trim: true
    },
    purchasePrice: {
      type: Number,
      default: 0
    },
    sellingPrice: {
      type: Number,
      default: 0
    },
    openingQuantity: {
      type: Number,
      default: 0
    },
    openingRate: {
      type: Number,
      default: 0
    },
    minimumStock: {
      type: Number,
      default: 0
    },
    barcode: {
      type: String,
      trim: true,
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: null
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

applySoftDeleteFields(productSchema);
applyAuditFields(productSchema);

productSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = {
  Product: mongoose.model("Product", productSchema)
};
