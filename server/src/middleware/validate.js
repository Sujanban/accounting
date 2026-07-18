const { ApiError } = require("../utils/apiError");
const { ERROR_CODES } = require("../shared/constants/errors");

function validate(schema) {
  return function validationMiddleware(request, _response, next) {
    const errors = schema(request.body || {});

    if (errors.length > 0) {
      return next(new ApiError(400, "Validation failed.", ERROR_CODES.VALIDATION_ERROR, errors));
    }

    return next();
  };
}

module.exports = {
  validate
};
