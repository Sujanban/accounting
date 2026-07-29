const { env } = require("./config/env");
const { connectDatabase } = require("./config/database");
const { app } = require("./app");

async function startServer() {
  await connectDatabase();

  const server = app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
  server.requestTimeout = env.requestTimeoutMs;
  server.headersTimeout = Math.min(env.requestTimeoutMs + 5_000, 60_000);
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
