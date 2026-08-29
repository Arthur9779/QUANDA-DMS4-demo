const { ApiError } = require("../lib/errors");

function notFoundHandler(request, response) {
  response.status(404).json({
    error: "not_found",
    message: "The requested endpoint was not found.",
    requestId: request.requestId,
  });
}

function errorHandler(error, request, response, _next) {
  if (error instanceof ApiError) {
    return response.status(error.status).json({
      error: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
      requestId: request.requestId,
    });
  }

  if (error?.type === "entity.too.large") {
    return response.status(413).json({
      error: "payload_too_large",
      message: "The request body is too large.",
      requestId: request.requestId,
    });
  }
  if (error instanceof SyntaxError && error?.type === "entity.parse.failed") {
    return response.status(400).json({
      error: "invalid_json",
      message: "The request body was not valid JSON.",
      requestId: request.requestId,
    });
  }

  console.error(`[QUANDA API] request_failed requestId=${request.requestId}`);
  return response.status(500).json({
    error: "internal_error",
    message: "The request could not be completed.",
    requestId: request.requestId,
  });
}

module.exports = { errorHandler, notFoundHandler };
