const express = require("express");

const { bootstrapDashboard } = require("../controllers/dashboardController");
const {
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear
} = require("../middleware/auth");
const { requireCompletedOnboarding } = require("../middleware/onboarding");

const dashboardRouter = express.Router();

dashboardRouter.get(
  "/bootstrap",
  requireAuth,
  resolveActiveCompany,
  resolveActiveFiscalYear,
  requireCompletedOnboarding,
  bootstrapDashboard
);

module.exports = {
  dashboardRouter
};
