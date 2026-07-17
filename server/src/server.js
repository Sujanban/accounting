const { env } = require("./config/env");
const { connectDatabase } = require("./config/database");
const { app } = require("./app");

async function startServer() {
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
