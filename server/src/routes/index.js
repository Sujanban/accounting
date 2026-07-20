const express = require("express");

const { authRouter } = require("./authRoutes");
const { accountingRouter } = require("./accountingRoutes");
const { companyRouter } = require("./companyRoutes");
const { settingRouter } = require("./settingRoutes");
const { businessMasterRouter } = require("./businessMasterRoutes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/accounting", accountingRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/settings", settingRouter);
apiRouter.use("/", businessMasterRouter);

module.exports = {
  apiRouter
};
