const logger = require("../config/logger.config.js");
const { errorResponse } = require("../utils/response.util.js");

module.exports.handleError = (error) => {
  logger.error("Unhandled Error", {
    message: error.message,
    stack: error.stack
  });

  return {
    status: 500,
    body: errorResponse()
  };
};
