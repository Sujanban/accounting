const cors = require("cors");
const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const path = require("path");

const { env } = require("./config/env");
const { docsRouter } = require("./routes/docsRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { apiRouter } = require("./routes");
const { systemRouter } = require("./routes/systemRoutes");
const { requestContext } = require("./middleware/observability");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(requestContext);
app.use(helmet());
app.use(compression());

if (env.clientOrigin) {
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
}
app.use(express.json({ limit: env.requestBodyLimit }));
app.use(rateLimit({ windowMs: env.rateLimitWindowMs, limit: env.rateLimitMax, standardHeaders: "draft-8", legacyHeaders: false, message: { success: false, message: "Too many requests. Please try again later.", errorCode: "RATE_LIMITED" } }));

app.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "Server is healthy"
  });
});

app.use("/api/docs", docsRouter);
app.use("/api/system", systemRouter);
app.use("/api", apiRouter);

if (env.nodeEnv === "production") {
  const clientBuildPath = path.resolve(__dirname, "../../client/dist");

  app.use(express.static(clientBuildPath, { index: false, maxAge: "1h" }));
  app.get("/{*splat}", (request, response, next) => {
    if (request.path.startsWith("/api") || request.path === "/health") return next();
    return response.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = {
  app
};
