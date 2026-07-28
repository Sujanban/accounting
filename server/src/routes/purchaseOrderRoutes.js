const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { validate } = require("../middleware/validate");
const { validateSalesOrder } = require("../validators/salesOrderValidators");
const service = require("../services/purchaseOrderService");
const { PurchaseOrder } = require("../models/PurchaseOrder");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");

const purchaseOrderRouter = express.Router();
purchaseOrderRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

purchaseOrderRouter.get("/", requireRoles("OWNER", "ADMIN", "ACCOUNTANT", "INVENTORY_MANAGER", "STAFF"), asyncHandler(async (req, res) => sendSuccess(res, 200, "Purchase orders fetched successfully.", await service.list(req.auth.activeCompanyId, req.query))));
purchaseOrderRouter.post("/", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateSalesOrder), asyncHandler(async (req, res) => sendSuccess(res, 201, "Purchase order created successfully.", await service.create(req.auth.activeCompanyId, req.auth.user._id, req.body))));
purchaseOrderRouter.patch("/:id", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), validate(validateSalesOrder), asyncHandler(async (req, res) => sendSuccess(res, 200, "Purchase order updated successfully.", await service.update(req.auth.activeCompanyId, req.auth.user._id, req.params.id, req.body))));
purchaseOrderRouter.post("/:id/status", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), asyncHandler(async (req, res) => {
  if (!["CONFIRMED", "CANCELLED"].includes(req.body.status)) throw new ApiError(422, "Status must be CONFIRMED or CANCELLED.");
  const order = await PurchaseOrder.findOne({ _id: req.params.id, companyId: req.auth.activeCompanyId });
  if (!order || order.status !== "DRAFT") throw new ApiError(409, "Only draft purchase orders can change status.");
  order.status = req.body.status;
  order.updatedBy = req.auth.user._id;
  await order.save();
  return sendSuccess(res, 200, "Purchase order status updated successfully.", order);
}));

module.exports = { purchaseOrderRouter };
