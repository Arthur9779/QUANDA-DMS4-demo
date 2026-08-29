class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function badRequest(code, message, details) {
  return new ApiError(400, code, message, details);
}

function unauthorized(code = "unauthorized", message = "Authentication is required.") {
  return new ApiError(401, code, message);
}

function forbidden(code = "forbidden", message = "This action is not allowed.") {
  return new ApiError(403, code, message);
}

function notFound(code = "not_found", message = "The requested resource was not found.") {
  return new ApiError(404, code, message);
}

function conflict(code, message) {
  return new ApiError(409, code, message);
}

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};
