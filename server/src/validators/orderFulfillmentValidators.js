const mongoose = require("mongoose");
const { isValidBsDate } = require("../services/nepalDateService");

function validateOrderFulfillment(body) {
  const errors = [];
  const allowed = new Set(["warehouseId", "fulfillmentDate"]);

  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  }

  if (!mongoose.isObjectIdOrHexString(body.warehouseId)) {
    errors.push({ field: "warehouseId", message: "Warehouse must be a valid identifier." });
  }

  if (body.fulfillmentDate !== undefined && !isValidBsDate(body.fulfillmentDate)) {
    errors.push({ field: "fulfillmentDate", message: "Fulfillment date must be a valid Bikram Sambat date in YYYY-MM-DD format." });
  }

  return errors;
}

module.exports = { validateOrderFulfillment };
