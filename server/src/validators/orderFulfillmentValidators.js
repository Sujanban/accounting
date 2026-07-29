const mongoose = require("mongoose");

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateOrderFulfillment(body) {
  const errors = [];
  const allowed = new Set(["warehouseId", "fulfillmentDate"]);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  }

  if (!mongoose.isObjectIdOrHexString(body.warehouseId)) {
    errors.push({ field: "warehouseId", message: "Warehouse must be a valid identifier." });
  }

  if (body.fulfillmentDate !== undefined && !isIsoDate(body.fulfillmentDate)) {
    errors.push({ field: "fulfillmentDate", message: "Fulfillment date must be a valid YYYY-MM-DD date." });
  }

  return errors;
}

module.exports = { validateOrderFulfillment };
