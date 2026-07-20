function sendSuccess(response, statusCode, message, data) {
  return response.status(statusCode).json({
    success: true,
    message,
    data,
    requestId: response.req?.requestId
  });
}

module.exports = {
  sendSuccess
};
