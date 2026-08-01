const mongoose = require("mongoose");
const { isValidBsDate } = require("../services/nepalDateService");
const isId = (value) => typeof value === "string" && mongoose.isObjectIdOrHexString(value);

function validateAttendanceVoucher(body) {
  const errors = [];
  const allowed = new Set(["attendanceDate", "narration", "entries"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!isValidBsDate(body.attendanceDate)) errors.push({ field: "attendanceDate", message: "Attendance date must be a valid Bikram Sambat date in YYYY-MM-DD format." });
  if (body.narration !== undefined && (typeof body.narration !== "string" || body.narration.length > 1000)) errors.push({ field: "narration", message: "Narration must be text with at most 1000 characters." });
  if (!Array.isArray(body.entries) || body.entries.length < 1 || body.entries.length > 500) errors.push({ field: "entries", message: "Add between 1 and 500 attendance entries." });
  else body.entries.forEach((entry, index) => { if (!entry || !isId(entry.employeeId) || !["PRESENT", "ABSENT", "LEAVE", "OVERTIME"].includes(entry.attendanceType) || !Number.isFinite(entry.units) || entry.units <= 0) errors.push({ field: `entries[${index}]`, message: "Each entry needs an employee, attendance type, and positive units." }); });
  return errors;
}

module.exports = { validateAttendanceVoucher };
