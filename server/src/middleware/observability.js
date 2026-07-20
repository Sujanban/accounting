const { randomUUID } = require("crypto");

const metrics = { startedAt: new Date(), requests: 0, errors: 0, totalDurationMs: 0 };

function requestContext(request, response, next) {
  const requestId = request.get("x-request-id") || randomUUID();
  const startedAt = process.hrtime.bigint();
  request.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  response.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    metrics.requests += 1; metrics.totalDurationMs += durationMs;
    if (response.statusCode >= 500) metrics.errors += 1;
    console.info(JSON.stringify({ level: "info", event: "http_request", requestId, method: request.method, path: request.path, statusCode: response.statusCode, durationMs: Number(durationMs.toFixed(2)) }));
  });
  next();
}

function getMetrics() {
  const memory = process.memoryUsage();
  return { uptimeSeconds: Math.floor(process.uptime()), startedAt: metrics.startedAt.toISOString(), requests: metrics.requests, errors: metrics.errors, averageDurationMs: metrics.requests ? Number((metrics.totalDurationMs / metrics.requests).toFixed(2)) : 0, memory: { rssBytes: memory.rss, heapUsedBytes: memory.heapUsed, heapTotalBytes: memory.heapTotal } };
}

module.exports = { requestContext, getMetrics };
