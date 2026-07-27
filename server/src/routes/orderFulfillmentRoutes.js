const express = require("express");
const { requireAuth, resolveActiveCompany, resolveActiveFiscalYear, requireRoles } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");
const { SalesOrder } = require("../models/SalesOrder");
const { PurchaseOrder } = require("../models/PurchaseOrder");
const { OrderFulfillment } = require("../models/OrderFulfillment");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { ApiError } = require("../utils/apiError");

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
  const document = await OrderFulfillment.create({ companyId: req.auth.activeCompanyId, orderId: order._id, orderType: type, fulfillmentNumber: `${type === "SALES" ? "DN" : "GRN"}-${new OrderFulfillment()._id}`, fulfillmentDate: req.body.fulfillmentDate || new Date(), createdBy: req.auth.user._id, updatedBy: req.auth.user._id });
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
