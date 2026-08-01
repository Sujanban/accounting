const mongoose = require("mongoose");
const { isValidBsDate } = require("../services/nepalDateService");

function validateLeaveRequest(body) {
  const errors = [];
  const allowed = new Set(["employeeId", "leaveType", "startDate", "endDate", "reason"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!mongoose.isObjectIdOrHexString(body.employeeId)) errors.push({ field: "employeeId", message: "Employee must be a valid identifier." });
  if (!["ANNUAL", "SICK", "UNPAID", "OTHER"].includes(body.leaveType)) errors.push({ field: "leaveType", message: "Leave type is invalid." });
  if (!isValidBsDate(body.startDate)) errors.push({ field: "startDate", message: "Start date must be a valid Bikram Sambat date in YYYY-MM-DD format." });
  if (!isValidBsDate(body.endDate)) errors.push({ field: "endDate", message: "End date must be a valid Bikram Sambat date in YYYY-MM-DD format." });
  if (isValidBsDate(body.startDate) && isValidBsDate(body.endDate) && body.startDate > body.endDate) errors.push({ field: "endDate", message: "End date must be on or after the start date." });
  if (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 1000)) errors.push({ field: "reason", message: "Reason must be text with at most 1000 characters." });
  return errors;
}

function validateLeaveRequestDecision(body) {
  const errors = [];
  const allowed = new Set(["status"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!["APPROVED", "REJECTED"].includes(body.status)) errors.push({ field: "status", message: "Status must be APPROVED or REJECTED." });
  return errors;
}

module.exports = { validateLeaveRequest, validateLeaveRequestDecision };
