const { ApiError } = require("../utils/apiError");

function validate(schema) {
  return function validationMiddleware(request, _response, next) {
    const errors = schema(request.body || {});

    if (errors.length > 0) {
      return next(new ApiError(400, "Validation failed.", errors));
    }

    return next();
  };
}

module.exports = {
  validate
};
