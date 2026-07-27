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
const { fiscalYearRouter } = require("./fiscalYearRoutes");
const { salesOrderRouter } = require("./salesOrderRoutes");
const { purchaseOrderRouter } = require("./purchaseOrderRoutes");
const { fixedAssetRouter } = require("./fixedAssetRoutes");
const { leadRouter } = require("./leadRoutes");

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/accounting", accountingRouter);
apiRouter.use("/companies", companyRouter);
apiRouter.use("/settings", settingRouter);
apiRouter.use("/fiscal-years", fiscalYearRouter);
apiRouter.use("/", businessMasterRouter);
apiRouter.use("/transactions", transactionRouter);
apiRouter.use("/", voucherRouter);
apiRouter.use("/reports", reportRouter);
apiRouter.use("/localization", localizationRouter);
apiRouter.use("/", enterpriseRouter);
apiRouter.use("/sales-orders", salesOrderRouter);
apiRouter.use("/purchase-orders", purchaseOrderRouter);
apiRouter.use("/fixed-assets", fixedAssetRouter);
apiRouter.use("/leads", leadRouter);

module.exports = {
  apiRouter
};
