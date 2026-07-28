const mongoose = require("mongoose");
const isId = (value) => typeof value === "string" && mongoose.isObjectIdOrHexString(value);

function validateEmployee(body) {
  const errors = [];
  const allowed = new Set(["branchId", "employeeCode", "name", "baseSalary", "email"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!isId(body.branchId)) errors.push({ field: "branchId", message: "Branch must be a valid identifier." });
  if (typeof body.employeeCode !== "string" || !/^[A-Za-z0-9_-]{2,40}$/.test(body.employeeCode.trim())) errors.push({ field: "employeeCode", message: "Employee code must be 2-40 letters, numbers, underscores, or hyphens." });
  if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 200) errors.push({ field: "name", message: "Employee name is required and must be at most 200 characters." });
  if (!Number.isFinite(body.baseSalary) || body.baseSalary < 0) errors.push({ field: "baseSalary", message: "Base salary must be a non-negative number." });
  if (body.email !== undefined && body.email !== null && (typeof body.email !== "string" || body.email.trim().length > 254)) errors.push({ field: "email", message: "Email must be text with at most 254 characters." });
  return errors;
}

module.exports = { validateEmployee };
