const dotenv = require("dotenv");
const path = require("path");

const rootEnvPath = path.resolve(__dirname, "../../../.env");
const legacyEnvPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: rootEnvPath, quiet: true });

// Keep existing local setups working while root .env is the canonical deployment contract.
if (!process.env.MONGODB_URI) dotenv.config({ path: legacyEnvPath, quiet: true });

function readEnv(name, fallback) {
  const value = process.env[name] || fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Configure it in ${rootEnvPath} or your deployment environment.`);
  }

  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || null,
  mongoUri: readEnv("MONGODB_URI"),
  jwtAccessSecret: readEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: readEnv("JWT_REFRESH_SECRET"),
  accessTokenTtl: readEnv("ACCESS_TOKEN_TTL", "15m"),
  refreshTokenTtl: readEnv("REFRESH_TOKEN_TTL", "30d"),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || "1mb",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300)
};

module.exports = {
  env
};
