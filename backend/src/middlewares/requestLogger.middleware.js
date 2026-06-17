const crypto = require("crypto");
const logger = require("../config/logger.config.js");

const requestLogger = function (req, res, next) {
  req.requestId = crypto.randomUUID();

  req.sessionId =
    req.headers["x-session-id"] || crypto.randomUUID();

  logger.info({
    apiId: req.originalUrl,
    action: `${req.method} request`,
    requestId: req.requestId,
    sessionId: req.sessionId,
    message: `${req.method} ${req.originalUrl}`
  });

  next();
}

module.exports = requestLogger;