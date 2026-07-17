const { loginUser, logoutUser, refreshUserToken, registerUser } = require("../services/authService");
const { buildSessionPayload } = require("../services/sessionService");
const { sendSuccess } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

function getRequestMetadata(request) {
  return {
    userAgent: request.get("user-agent"),
    ip: request.ip
  };
}

const register = asyncHandler(async (request, response) => {
  const result = await registerUser(request.body, getRequestMetadata(request));

  return sendSuccess(response, 201, "User registered successfully.", result);
});

const login = asyncHandler(async (request, response) => {
  const result = await loginUser(request.body, getRequestMetadata(request));

  return sendSuccess(response, 200, "Login successful.", result);
});

const refresh = asyncHandler(async (request, response) => {
  const result = await refreshUserToken(
    request.body.refreshToken,
    getRequestMetadata(request)
  );

  return sendSuccess(response, 200, "Token refreshed successfully.", result);
});

const logout = asyncHandler(async (request, response) => {
  await logoutUser(request.body.refreshToken);

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
