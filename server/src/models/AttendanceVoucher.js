const mongoose = require("mongoose");
const { applyAuditFields } = require("./schemaHelpers");

const attendanceEntrySchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  attendanceType: { type: String, enum: ["PRESENT", "ABSENT", "LEAVE", "OVERTIME"], required: true },
  units: { type: Number, required: true, min: 0.000001 },
}, { _id: false });

const attendanceVoucherSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
  fiscalYearId: { type: mongoose.Schema.Types.ObjectId, ref: "FiscalYear", required: true, index: true },
  attendanceDate: { type: Date, required: true },
  narration: { type: String, trim: true, maxlength: 1000, default: null },
  entries: { type: [attendanceEntrySchema], required: true },
}, { timestamps: true });

attendanceVoucherSchema.index({ companyId: 1, attendanceDate: -1, _id: -1 });
applyAuditFields(attendanceVoucherSchema);
module.exports = { AttendanceVoucher: mongoose.model("AttendanceVoucher", attendanceVoucherSchema) };
