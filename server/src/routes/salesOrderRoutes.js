const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { validateSalesOrder } = require("../validators/salesOrderValidators");
const service = require("../services/salesOrderService");
const { SalesOrder } = require("../models/SalesOrder");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");

const salesOrderRouter = express.Router();
salesOrderRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

salesOrderRouter.get("/", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "SALES", "STAFF"), asyncHandler(async (req, res) => sendSuccess(res, 200, "Sales orders fetched successfully.", await service.list(req.auth.activeCompanyId, req.query))));
salesOrderRouter.post("/", requireRoles("OWNER", "ADMIN", "SALES"), validate(validateSalesOrder), asyncHandler(async (req, res) => sendSuccess(res, 201, "Sales order created successfully.", await service.create(req.auth.activeCompanyId, req.auth.user._id, req.body))));
salesOrderRouter.patch("/:id", requireRoles("OWNER", "ADMIN", "SALES"), validate(validateSalesOrder), asyncHandler(async (req, res) => sendSuccess(res, 200, "Sales order updated successfully.", await service.update(req.auth.activeCompanyId, req.auth.user._id, req.params.id, req.body))));
salesOrderRouter.post("/:id/close", requireRoles("OWNER", "ADMIN", "SALES"), asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 500) throw new ApiError(422, "A pre-close reason of up to 500 characters is required.");
  return sendSuccess(res, 200, "Sales order pre-closed successfully.", await service.close(req.auth.activeCompanyId, req.auth.user._id, req.params.id, reason));
}));
salesOrderRouter.post("/:id/status", requireRoles("OWNER", "ADMIN", "SALES"), asyncHandler(async (req, res) => {
  if (!["CONFIRMED", "CANCELLED"].includes(req.body.status)) throw new ApiError(422, "Status must be CONFIRMED or CANCELLED.");
  const order = await SalesOrder.findOne({ _id: req.params.id, companyId: req.auth.activeCompanyId });
  if (!order || order.status !== "DRAFT") throw new ApiError(409, "Only draft sales orders can change status.");
  order.status = req.body.status;
  order.updatedBy = req.auth.user._id;
  await order.save();
  return sendSuccess(res, 200, "Sales order status updated successfully.", order);
}));

module.exports = { salesOrderRouter };
