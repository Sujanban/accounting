const { SalesOrder } = require("../models/SalesOrder"); const { Branch } = require("../models/Branch"); const { Contact } = require("../models/Contact"); const { Product } = require("../models/Product"); const { ApiError } = require("../utils/apiError");
const map = (order) => ({ id: order._id, branchId: order.branchId, contactId: order.contactId, orderNumber: order.orderNumber, orderDate: order.orderDate, items: order.items, notes: order.notes, status: order.status, closedAt: order.closedAt, closeReason: order.closeReason, createdAt: order.createdAt, updatedAt: order.updatedAt });
async function create(companyId, userId, input) { const [branch, contact, products] = await Promise.all([Branch.findOne({ _id: input.branchId, companyId, isActive: true }).lean(), Contact.findOne({ _id: input.contactId, companyId, isActive: true, roles: "CUSTOMER" }).lean(), Product.countDocuments({ _id: { $in: input.items.map((item) => item.productId) }, companyId, isActive: true })]); if (!branch || !contact || products !== new Set(input.items.map((item) => item.productId)).size) throw new ApiError(422, "The branch, customer, or one or more products are unavailable."); const order = await SalesOrder.create({ ...input, companyId, orderNumber: `SO-${new SalesOrder()._id}`, createdBy: userId, updatedBy: userId }); return map(order); }
async function update(companyId, userId, orderId, input) {
  const order = await SalesOrder.findOne({ _id: orderId, companyId });
  if (!order) throw new ApiError(404, "Sales order not found.");
  if (order.status !== "DRAFT") throw new ApiError(409, "Only draft sales orders can be edited.");

  const [branch, contact, products] = await Promise.all([
    Branch.findOne({ _id: input.branchId, companyId, isActive: true }).lean(),
    Contact.findOne({ _id: input.contactId, companyId, isActive: true, roles: "CUSTOMER" }).lean(),
    Product.countDocuments({ _id: { $in: input.items.map((item) => item.productId) }, companyId, isActive: true })
  ]);
  if (!branch || !contact || products !== new Set(input.items.map((item) => item.productId)).size) throw new ApiError(422, "The branch, customer, or one or more products are unavailable.");

  order.branchId = input.branchId;
  order.contactId = input.contactId;
  order.orderDate = input.orderDate;
  order.items = input.items;
  order.notes = input.notes || null;
  order.updatedBy = userId;
  await order.save();
  return map(order);
}
async function close(companyId, userId, orderId, reason) {
  const order = await SalesOrder.findOne({ _id: orderId, companyId });
  if (!order) throw new ApiError(404, "Sales order not found.");
  if (order.status !== "CONFIRMED") throw new ApiError(409, "Only confirmed sales orders can be pre-closed.");
  order.status = "CLOSED";
  order.closedAt = new Date();
  order.closeReason = reason.trim();
  order.updatedBy = userId;
  await order.save();
  return map(order);
}
async function list(companyId, query) { const page = Math.max(1, Number(query.page) || 1); const limit = Math.min(100, Math.max(1, Number(query.limit) || 20)); const filters = { companyId }; if (["DRAFT", "CONFIRMED", "CANCELLED", "CLOSED"].includes(query.status)) filters.status = query.status; const [items, total] = await Promise.all([SalesOrder.find(filters).sort({ orderDate: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), SalesOrder.countDocuments(filters)]); return { items: items.map(map), meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total } }; }
module.exports = { create, update, close, list };
