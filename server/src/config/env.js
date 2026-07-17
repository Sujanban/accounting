const dotenv = require("dotenv");

dotenv.config();

function readEnv(name, fallback) {
  const value = process.env[name] || fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientOrigin: readEnv("CLIENT_ORIGIN", "http://localhost:3000"),
  mongoUri: readEnv("MONGODB_URI"),
  jwtAccessSecret: readEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: readEnv("JWT_REFRESH_SECRET"),
  accessTokenTtl: readEnv("ACCESS_TOKEN_TTL", "15m"),
  refreshTokenTtl: readEnv("REFRESH_TOKEN_TTL", "30d")
};

module.exports = {
  env
};
