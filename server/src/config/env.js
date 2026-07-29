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

function readPositiveNumber(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number.`);
  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";
if (nodeEnv === "production" && !process.env.CLIENT_ORIGIN) throw new Error("CLIENT_ORIGIN is required in production.");

const env = {
  nodeEnv,
  port: readPositiveNumber("PORT", 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || null,
  mongoUri: readEnv("MONGODB_URI"),
  jwtAccessSecret: readEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: readEnv("JWT_REFRESH_SECRET"),
  accessTokenTtl: readEnv("ACCESS_TOKEN_TTL", "15m"),
  refreshTokenTtl: readEnv("REFRESH_TOKEN_TTL", "30d"),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || "1mb",
  rateLimitWindowMs: readPositiveNumber("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  rateLimitMax: readPositiveNumber("RATE_LIMIT_MAX", 300),
  authRateLimitMax: readPositiveNumber("AUTH_RATE_LIMIT_MAX", 10),
  requestTimeoutMs: readPositiveNumber("REQUEST_TIMEOUT_MS", 30_000),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || null,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || null,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || null,
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES || 10 * 1024 * 1024)
};

module.exports = {
  env
};
