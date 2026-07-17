const express = require("express");

const { authRouter } = require("./authRoutes");
const { companyRouter } = require("./companyRoutes");
const { dashboardRouter } = require("./dashboardRoutes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/dashboard", dashboardRouter);

module.exports = {
  apiRouter
};
