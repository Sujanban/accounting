const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { env } = require("../config/env");
const { RefreshToken } = require("../models/RefreshToken");
const { User } = require("../models/User");
const { ApiError } = require("../utils/apiError");
const { sha256 } = require("../utils/crypto");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} = require("../utils/token");
const { buildSessionPayload } = require("./sessionService");

function parseExpiryDate(rawToken) {
  const decoded = jwt.decode(rawToken);

  if (!decoded || !decoded.exp) {
    throw new ApiError(500, "Failed to determine refresh token expiry.");
  }

  return new Date(decoded.exp * 1000);
}

function buildAccessTokenClaims(user) {
  return {
    sub: String(user._id),
    email: user.email
  };
}

async function issueTokenPair(user, metadata = {}) {
  const accessToken = signAccessToken(buildAccessTokenClaims(user));
  const refreshToken = signRefreshToken({ sub: String(user._id) });

  await RefreshToken.create({
    userId: user._id,
    tokenHash: sha256(refreshToken),
    userAgent: metadata.userAgent || null,
    ip: metadata.ip || null,
    expiresAt: parseExpiryDate(refreshToken)
  });

  return {
    accessToken,
    refreshToken
  };
}

async function registerUser({ name, email, phone, password }, metadata) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    passwordHash
  });

  const tokens = await issueTokenPair(user, metadata);
  const session = await buildSessionPayload(user);

  return {
    tokens,
    session
  };
}

async function loginUser({ email, password }, metadata) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been disabled.");
  }

  const tokens = await issueTokenPair(user, metadata);
  const session = await buildSessionPayload(user);

  return {
    tokens,
    session
  };
}

async function refreshUserToken(refreshToken, metadata) {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const storedToken = await RefreshToken.findOne({
    tokenHash: sha256(refreshToken),
    revokedAt: null
  });

  if (!storedToken || String(storedToken.userId) !== String(payload.sub)) {
    throw new ApiError(401, "Refresh token is not active.");
  }

  if (storedToken.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(401, "Refresh token has expired.");
  }

  storedToken.revokedAt = new Date();
  await storedToken.save();

  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, "User session is no longer valid.");
  }

  const tokens = await issueTokenPair(user, metadata);
  const session = await buildSessionPayload(user);

  return {
    tokens,
    session
  };
}

async function logoutUser(refreshToken) {
  const storedToken = await RefreshToken.findOne({
    tokenHash: sha256(refreshToken),
    revokedAt: null
  });

  if (!storedToken) {
    return;
  }

  storedToken.revokedAt = new Date();
  await storedToken.save();
}

module.exports = {
  registerUser,
  loginUser,
  refreshUserToken,
  logoutUser
};
