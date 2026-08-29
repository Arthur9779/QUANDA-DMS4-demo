const crypto = require("node:crypto");

function requestContext(request, response, next) {
  const suppliedId = request.get("x-request-id");
  const requestId =
    suppliedId && /^[A-Za-z0-9._-]{8,80}$/.test(suppliedId)
      ? suppliedId
      : crypto.randomUUID();
  request.requestId = requestId;
  response.set("X-Request-Id", requestId);
  next();
}

module.exports = { requestContext };
