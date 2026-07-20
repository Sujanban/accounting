const express = require("express");

const { authRouter } = require("./authRoutes");
const { accountingRouter } = require("./accountingRoutes");
const { companyRouter } = require("./companyRoutes");
const { settingRouter } = require("./settingRoutes");
const { businessMasterRouter } = require("./businessMasterRoutes");
const { transactionRouter } = require("./transactionRoutes");
const { voucherRouter } = require("./voucherRoutes");
const { reportRouter } = require("./reportRoutes");
const { localizationRouter } = require("./localizationRoutes");
const { enterpriseRouter } = require("./enterpriseRoutes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/accounting", accountingRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/settings", settingRouter);
apiRouter.use("/", businessMasterRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/", voucherRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/localization", localizationRouter);
apiRouter.use("/", enterpriseRouter);

module.exports = {
  apiRouter
};
