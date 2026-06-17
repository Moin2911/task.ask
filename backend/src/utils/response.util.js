module.exports.successResponse = (
  data,
  message = "Success"
) => ({
  success: true,
  message,
  data
});

module.exports.errorResponse = (
  message = "Internal Server Error"
) => ({
  success: false,
  message
});
