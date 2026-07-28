const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { validateEmployee } = require("../validators/payrollValidators");
const { validateAttendanceVoucher } = require("../validators/attendanceValidators");
const { Employee } = require("../models/Employee");
const { AttendanceVoucher } = require("../models/AttendanceVoucher");
const { Branch } = require("../models/Branch");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");

const payrollRouter = express.Router();
payrollRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);
payrollRouter.get("/employees", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), asyncHandler(async (req, res) => sendSuccess(res, 200, "Employees fetched successfully.", await Employee.find({ companyId: req.auth.activeCompanyId, isActive: true }).sort({ employeeCode: 1 }).lean())));
payrollRouter.post("/employees", requireRoles("OWNER", "ADMIN"), validate(validateEmployee), asyncHandler(async (req, res) => {
  const branch = await Branch.findOne({ _id: req.body.branchId, companyId: req.auth.activeCompanyId, isActive: true }).lean();
  if (!branch) throw new ApiError(422, "The selected branch is unavailable.");
  const employee = await Employee.create({ companyId: req.auth.activeCompanyId, branchId: branch._id, employeeCode: req.body.employeeCode.trim().toUpperCase(), name: req.body.name.trim(), baseSalary: req.body.baseSalary, email: req.body.email?.trim().toLowerCase() || null, createdBy: req.auth.user._id, updatedBy: req.auth.user._id });
  return sendSuccess(res, 201, "Employee created successfully.", employee);
}));
payrollRouter.put("/employees/:id", requireRoles("OWNER", "ADMIN"), validate(validateEmployee), asyncHandler(async (req, res) => {
  const employee = await Employee.findOne({ _id: req.params.id, companyId: req.auth.activeCompanyId, isActive: true });
  if (!employee) throw new ApiError(404, "Employee was not found.");
  const branch = await Branch.findOne({ _id: req.body.branchId, companyId: req.auth.activeCompanyId, isActive: true }).lean();
  if (!branch) throw new ApiError(422, "The selected branch is unavailable.");
  Object.assign(employee, { branchId: branch._id, employeeCode: req.body.employeeCode.trim().toUpperCase(), name: req.body.name.trim(), baseSalary: req.body.baseSalary, email: req.body.email?.trim().toLowerCase() || null, updatedBy: req.auth.user._id });
  await employee.save();
  return sendSuccess(res, 200, "Employee updated successfully.", employee);
}));
payrollRouter.get("/attendance", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "STAFF"), asyncHandler(async (req, res) => sendSuccess(res, 200, "Attendance vouchers fetched successfully.", await AttendanceVoucher.find({ companyId: req.auth.activeCompanyId, fiscalYearId: req.auth.activeFiscalYearId }).sort({ attendanceDate: -1, _id: -1 }).lean())));
payrollRouter.post("/attendance", requireRoles("OWNER", "ADMIN", "STAFF"), validate(validateAttendanceVoucher), asyncHandler(async (req, res) => {
  const employeeIds = [...new Set(req.body.entries.map((entry) => entry.employeeId))];
  const count = await Employee.countDocuments({ _id: { $in: employeeIds }, companyId: req.auth.activeCompanyId, isActive: true });
  if (count !== employeeIds.length) throw new ApiError(422, "One or more employees are unavailable.");
  const voucher = await AttendanceVoucher.create({ companyId: req.auth.activeCompanyId, fiscalYearId: req.auth.activeFiscalYearId, attendanceDate: req.body.attendanceDate, narration: req.body.narration?.trim() || null, entries: req.body.entries, createdBy: req.auth.user._id, updatedBy: req.auth.user._id });
  return sendSuccess(res, 201, "Attendance voucher created successfully.", voucher);
}));

module.exports = { payrollRouter };
