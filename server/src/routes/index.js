const express = require("express");

const { authRouter } = require("./authRoutes");
const { accountingRouter } = require("./accountingRoutes");
const { companyRouter } = require("./companyRoutes");
const { dashboardRouter } = require("./dashboardRoutes");
const { settingRouter } = require("./settingRoutes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/accounting", accountingRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/settings", settingRouter);

module.exports = {
  apiRouter
};
