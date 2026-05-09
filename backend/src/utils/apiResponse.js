const { ApiErrorResponseSchema } = require('../schemas/ApiErrorResponse');
const { ApiSuccessResponseSchema } = require('../schemas/ApiSuccessResponse');

function buildSuccess(data = {}, message) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return ApiSuccessResponseSchema.parse(response);
}

function buildError(code, message) {
  return ApiErrorResponseSchema.parse({
    success: false,
    error: {
      code,
      message,
    },
  });
}

function sendSuccess(res, data = {}, message, statusCode = 200) {
  return res.status(statusCode).json(buildSuccess(data, message));
}

function sendError(res, statusCode, code, message) {
  return res.status(statusCode).json(buildError(code, message));
}

module.exports = {
  buildError,
  buildSuccess,
  sendError,
  sendSuccess,
};
