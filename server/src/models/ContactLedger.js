const mongoose = require("mongoose");
const { applyAuditFields } = require("./schemaHelpers");

// A contact can have different receivable/payable ledgers in each fiscal year.
// Keep this mapping separate from Contact so historical statements remain stable.
const contactLedgerSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", required: true },
    fiscalYearId: { type: mongoose.Schema.Types.ObjectId, ref: "FiscalYear", required: true },
    role: { type: String, enum: ["CUSTOMER", "SUPPLIER"], required: true },
    ledgerId: { type: mongoose.Schema.Types.ObjectId, ref: "Ledger", required: true }
  },
  { timestamps: true }
);

applyAuditFields(contactLedgerSchema);
contactLedgerSchema.index({ companyId: 1, contactId: 1, fiscalYearId: 1, role: 1 }, { unique: true });
contactLedgerSchema.index({ companyId: 1, fiscalYearId: 1, ledgerId: 1 }, { unique: true });

module.exports = { ContactLedger: mongoose.model("ContactLedger", contactLedgerSchema) };
