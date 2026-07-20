const { ApiError } = require("../utils/apiError");
const { ERROR_CODES } = require("../shared/constants/errors");

function notFoundHandler(request, _response, next) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`));
}

function errorHandler(error, request, response, _next) {
  if (error && error.code === 11000) {
    return response.status(409).json({
      success: false,
      message: "A unique field already exists.",
      errorCode: ERROR_CODES.DUPLICATE_RESOURCE,
      errors: error.keyValue,
      requestId: request.requestId
    });
  }

  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message =
    error instanceof ApiError ? error.message : "Internal server error";
  const errorCode =
    error instanceof ApiError
      ? error.errorCode
      : ERROR_CODES.INTERNAL_SERVER_ERROR;
  const errors = error instanceof ApiError ? error.errors : undefined;

  if (!(error instanceof ApiError)) {
    console.error(error);
  }

  return response.status(statusCode).json({
    success: false,
    message,
    errorCode,
    ...(errors ? { errors } : {}),
    requestId: request.requestId
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
