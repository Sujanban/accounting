const express = require("express");

const { bootstrapDashboard } = require("../controllers/dashboardController");
const { requireAuth, resolveActiveCompany } = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");

const dashboardRouter = express.Router();

dashboardRouter.get(
  "/bootstrap",
  requireAuth,
  resolveActiveCompany,
  requireCompletedOnboarding,
  bootstrapDashboard
);

module.exports = {
  dashboardRouter
};
