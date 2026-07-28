const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { SalesOrder } = require("../models/SalesOrder");
const { PurchaseOrder } = require("../models/PurchaseOrder");
const { OrderFulfillment } = require("../models/OrderFulfillment");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");
const transactionService = require("../services/transactionService");

const orderFulfillmentRouter = express.Router();
orderFulfillmentRouter.use(requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireCompletedOnboarding);

async function findConfirmedOrder(companyId, id, type) {
  const Order = type === "SALES" ? SalesOrder : PurchaseOrder;
  const order = await Order.findOne({ _id: id, companyId });
  if (!order || order.status !== "CONFIRMED") throw new ApiError(409, "Only confirmed orders can be fulfilled or converted.");
  return order;
}

async function create(req, res, type) {
  const order = await findConfirmedOrder(req.auth.activeCompanyId, req.params.id, type);
  if (typeof req.body.warehouseId !== "string") throw new ApiError(422, "A warehouse is required.");
  const inventoryEntries = order.items.map((item) => ({ productId: item.productId, warehouseId: req.body.warehouseId, quantity: Number(item.quantity), unitCost: Number(item.unitPrice || 0), direction: type === "SALES" ? "OUT" : "IN" }));
  const draft = await transactionService.createDraft(req.auth.activeCompanyId, req.auth.activeFiscalYearId, { actorUserId: req.auth.user._id, actorRole: req.auth.membership.role, transactionType: type === "SALES" ? "DELIVERY_NOTE" : "RECEIPT_NOTE", voucherType: type === "SALES" ? "DN" : "RN", branchId: order.branchId, transactionDate: req.body.fulfillmentDate || new Date().toISOString().slice(0, 10), narration: `${type === "SALES" ? "Delivery note" : "Goods receipt"} for ${order.orderNumber}`, items: order.items, accountingEntries: [], inventoryEntries: inventoryEntries });
  const posted = await transactionService.postTransaction(req.auth.activeCompanyId, req.auth.activeFiscalYearId, draft.id, req.auth.user._id);
  const document = await OrderFulfillment.create({ companyId: req.auth.activeCompanyId, orderId: order._id, orderType: type, transactionId: posted.id, warehouseId: req.body.warehouseId, fulfillmentNumber: posted.voucherNumber, fulfillmentDate: req.body.fulfillmentDate || new Date(), createdBy: req.auth.user._id, updatedBy: req.auth.user._id });
  return sendSuccess(res, 201, type === "SALES" ? "Delivery note created successfully." : "Goods receipt created successfully.", document);
}

async function voucherPayload(req, res, type) {
  const order = await findConfirmedOrder(req.auth.activeCompanyId, req.params.id, type);
  return sendSuccess(res, 200, "Voucher draft payload created successfully.", { transactionType: type === "SALES" ? "SALE" : "PURCHASE", voucherType: type === "SALES" ? "SV" : "PV", branchId: order.branchId, transactionDate: new Date().toISOString().slice(0, 10), narration: `${type === "SALES" ? "Sales" : "Purchase"} order ${order.orderNumber}`, items: order.items, accountingEntries: [], inventoryEntries: [] });
}

orderFulfillmentRouter.post("/sales-orders/:id/deliveries", requireRoles("OWNER", "ADMIN", "SALES"), asyncHandler((req, res) => create(req, res, "SALES")));
orderFulfillmentRouter.post("/purchase-orders/:id/goods-receipts", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), asyncHandler((req, res) => create(req, res, "PURCHASE")));
orderFulfillmentRouter.get("/sales-orders/:id/voucher-draft", requireRoles("OWNER", "ADMIN", "SALES"), asyncHandler((req, res) => voucherPayload(req, res, "SALES")));
orderFulfillmentRouter.get("/purchase-orders/:id/voucher-draft", requireRoles("OWNER", "ADMIN", "INVENTORY_MANAGER"), asyncHandler((req, res) => voucherPayload(req, res, "PURCHASE")));

module.exports = { orderFulfillmentRouter };
