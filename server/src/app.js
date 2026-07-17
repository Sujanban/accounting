const cors = require("cors");
const express = require("express");

const { env } = require("./config/env");
const { docsRouter } = require("./routes/docsRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { apiRouter } = require("./routes");

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "Server is healthy"
  });
});

app.use("/api/docs", docsRouter);
app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app
};
