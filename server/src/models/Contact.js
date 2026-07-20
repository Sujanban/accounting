const mongoose = require("mongoose");
const { applySoftDeleteFields, applyAuditFields } = require("./schemaHelpers");

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: null },
    line2: { type: String, trim: true, default: null },
    city: { type: String, trim: true, default: null },
    district: { type: String, trim: true, default: null },
    country: { type: String, trim: true, default: "Nepal" }
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    contactCode: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true, default: null },
    roles: {
      type: [{ type: String, enum: ["CUSTOMER", "SUPPLIER", "EMPLOYEE", "VENDOR", "TRANSPORTER", "OTHER"] }],
      required: true,
      validate: { validator: (roles) => roles.length > 0, message: "At least one role is required." }
    },
    contactGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "ContactGroup", default: null },
    panNumber: { type: String, trim: true, default: null },
    vatNumber: { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    mobile: { type: String, trim: true, default: null },
    email: { type: String, trim: true, lowercase: true, default: null },
    website: { type: String, trim: true, default: null },
    billingAddress: { type: addressSchema, default: () => ({}) },
    shippingAddress: { type: addressSchema, default: () => ({}) },
    creditLimit: { type: Number, min: 0, default: 0 },
    paymentTermId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTerm", default: null },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: "Ledger", default: null },
    notes: { type: String, trim: true, maxlength: 2000, default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

applySoftDeleteFields(contactSchema);
applyAuditFields(contactSchema);
contactSchema.index({ companyId: 1, contactCode: 1 }, { unique: true });
contactSchema.index({ companyId: 1, name: 1 });
contactSchema.index({ companyId: 1, roles: 1 });

module.exports = { Contact: mongoose.model("Contact", contactSchema) };
