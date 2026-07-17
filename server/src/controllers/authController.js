const { loginUser, logoutUser, refreshUserToken, registerUser } = require("../services/authService");
const { env } = require("../config/env");
const { buildSessionPayload } = require("../services/sessionService");
const { sendSuccess } = require("../utils/apiResponse");
const { getRefreshCookieOptions, parseCookies } = require("../utils/cookies");
const { asyncHandler } = require("../utils/asyncHandler");

function getRequestMetadata(request) {
  return {
    userAgent: request.get("user-agent"),
    ip: request.ip
  };
}

function readRefreshToken(request) {
  if (request.body && typeof request.body.refreshToken === "string") {
    return request.body.refreshToken;
  }

  return parseCookies(request.headers.cookie || "").refreshToken || null;
}

const register = asyncHandler(async (request, response) => {
  const result = await registerUser(request.body, getRequestMetadata(request));

  return sendSuccess(response, 201, "User registered successfully.", result);
});

const login = asyncHandler(async (request, response) => {
  const result = await loginUser(request.body, getRequestMetadata(request));

  response.cookie(
    "refreshToken",
    result.tokens.refreshToken,
    {
      ...getRefreshCookieOptions(env.nodeEnv),
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  );

  return sendSuccess(response, 200, "Login successful.", {
    accessToken: result.tokens.accessToken,
    session: result.session
  });
});

const refresh = asyncHandler(async (request, response) => {
  const refreshToken = readRefreshToken(request);
  const result = await refreshUserToken(
    refreshToken,
    getRequestMetadata(request)
  );

  response.cookie(
    "refreshToken",
    result.tokens.refreshToken,
    {
      ...getRefreshCookieOptions(env.nodeEnv),
      maxAge: 30 * 24 * 60 * 60 * 1000
    }
  );

  return sendSuccess(response, 200, "Token refreshed successfully.", {
    accessToken: result.tokens.accessToken,
    session: result.session
  });
});

const logout = asyncHandler(async (request, response) => {
  await logoutUser(readRefreshToken(request));
  response.clearCookie("refreshToken", getRefreshCookieOptions(env.nodeEnv));

  return sendSuccess(response, 200, "Logout successful.");
});

const me = asyncHandler(async (request, response) => {
  const session = await buildSessionPayload(
    request.auth.user,
    request.auth.activeCompanyId
  );

  return sendSuccess(response, 200, "Session fetched successfully.", session);
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  me
};
