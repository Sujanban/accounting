class ApiError extends Error {
  constructor(statusCode, message, errorCodeOrErrors, maybeErrors) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode =
      typeof errorCodeOrErrors === "string"
        ? errorCodeOrErrors
        : inferDefaultErrorCode(statusCode);
    this.errors =
      typeof errorCodeOrErrors === "string" ? maybeErrors : errorCodeOrErrors;
  }
}

function inferDefaultErrorCode(statusCode) {
  if (statusCode === 400) {
    return "VALIDATION_ERROR";
  }

  if (statusCode === 401) {
    return "UNAUTHORIZED";
  }

  if (statusCode === 403) {
    return "FORBIDDEN";
  }

  if (statusCode === 404) {
    return "NOT_FOUND";
  }

  if (statusCode === 409) {
    return "CONFLICT";
  }

  return "INTERNAL_SERVER_ERROR";
}

module.exports = {
  ApiError
};
