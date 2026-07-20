const express = require("express");
const mongoose = require("mongoose");
const { getMetrics } = require("../middleware/observability");
const { requireAuth, requireRoles, resolveActiveCompany } = require("../middleware/auth");
const { sendSuccess } = require("../utils/apiResponse");

const systemRouter = express.Router();
systemRouter.get("/health", (_request, response) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return response.status(databaseReady ? 200 : 503).json({ success: databaseReady, status: databaseReady ? "ok" : "degraded", database: databaseReady ? "connected" : "disconnected" });
});
systemRouter.get("/metrics", requireAuth, resolveActiveCompany, requireRoles("OWNER", "ADMIN"), (_request, response) => sendSuccess(response, 200, "System metrics fetched successfully.", getMetrics()));
module.exports = { systemRouter };
