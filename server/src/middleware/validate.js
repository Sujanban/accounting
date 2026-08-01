const { ApiError } = require("../utils/apiError");
const { ERROR_CODES } = require("../shared/constants/errors");
const { normalizeBusinessDates } = require("../utils/businessDates");

function validate(schema) {
  return function validationMiddleware(request, _response, next) {
    const errors = schema(request.body || {});

    if (errors.length > 0) {
      return next(
        new ApiError(
          400,
          "Validation failed.",
          ERROR_CODES.VALIDATION_ERROR,
          errors,
        ),
      );
    }

    normalizeBusinessDates(request.body);
    return next();
  };
}

function validateQuery(schema) {
  return function queryValidationMiddleware(request, _response, next) {
    const query = request.query || {};
    const errors = schema(query);

    if (errors.length > 0) {
      return next(
        new ApiError(
          400,
          "Validation failed.",
          ERROR_CODES.VALIDATION_ERROR,
          errors,
        ),
      );
    }

    normalizeBusinessDates(query);
    Object.defineProperty(request, "query", {
      configurable: true,
      enumerable: true,
      value: query,
      writable: false
    });
    return next();
  };
}

module.exports = {
  validate,
  validateQuery,
};
