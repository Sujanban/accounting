const mongoose = require("mongoose");
const { isValidBsDate } = require("../services/nepalDateService");
const id = (value) => typeof value === "string" && mongoose.isObjectIdOrHexString(value);
function validateSalesOrder(body) {
  const errors = []; const allowed = new Set(["branchId", "contactId", "orderDate", "items", "notes"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!id(body.branchId)) errors.push({ field: "branchId", message: "Branch must be a valid identifier." });
  if (!id(body.contactId)) errors.push({ field: "contactId", message: "Customer must be a valid identifier." });
  if (!isValidBsDate(body.orderDate)) errors.push({ field: "orderDate", message: "Order date must be a valid Bikram Sambat date in YYYY-MM-DD format." });
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 500) errors.push({ field: "items", message: "Add between 1 and 500 order items." });
  else body.items.forEach((item, index) => { if (!item || !id(item.productId) || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0) errors.push({ field: `items[${index}]`, message: "Each item needs a product, positive quantity, and non-negative unit price." }); });
  if (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 2000)) errors.push({ field: "notes", message: "Notes must be text with at most 2000 characters." });
  return errors;
}
module.exports = { validateSalesOrder };
