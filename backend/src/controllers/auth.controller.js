const path = require("path");
const logger = require("../config/logger.config.js");
const {
  registerService,
  loginService,
  deleteEmployeeService,
  updateEmployeeService,
  forgotPasswordService,
  verifyOTPService,
  resetPasswordService
} = require("../services/auth.service.js");
const { successResponse, errorResponse } = require("../utils/response.util.js");

const SERVICE_NAME = "ask-innovation-backend";
const ENV = process.env.NODE_ENV || "dev";

module.exports.registerController = async (req, res) => {
  try {
    const files = req.files || {};
    const toUrlPath = (file) =>
      file?.filename
        ? path.posix.join("/uploads/employees", file.filename)
        : undefined;

    const payload = {
      ...req.body,
      aadhar_path: toUrlPath(files.aadhar_file?.[0]),
      pan_path: toUrlPath(files.pan_file?.[0]),
    };

    const data = await registerService(payload);

    logger.info({
      apiId: "AUTH_REGISTER",
      action: "User register",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: data.id,
      email: data.email,
      role: data.role,
      message: "User registered successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(201)
      .json(successResponse(data, "User registered"));
  } catch (error) {
    logger.error({
      apiId: "AUTH_REGISTER",
      action: "User register",
      requestId: req.requestId,
      sessionId: req.sessionId,
      error: error.message,
      message: "Register failed",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(400)
      .json(errorResponse(error.message, "AUTH_REGISTER_FAILED"));
  }
};

module.exports.loginController = async (req, res) => {
  try {
    const data = await loginService(req.body);

    logger.info({
      apiId: "AUTH_LOGIN",
      action: "User login",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: data.id,
      email: req.body.email,
      message: "User logged in successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(200)
      .json(successResponse(data, "Login successful"));
  } catch (error) {
    logger.error({
      apiId: "AUTH_LOGIN",
      action: "User login",
      requestId: req.requestId,
      sessionId: req.sessionId,
      error: error.message,
      message: "Login failed",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(401)
      .json(errorResponse(error.message, "AUTH_INVALID_CREDENTIALS"));
  }
};



module.exports.deleteEmployeeController = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteEmployeeService(id);

    logger.info({
      apiId: "AUTH_DELETE_EMPLOYEE",
      action: "Delete employee",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id, 
      employeeId: id,
      message: "Employee deleted successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res.status(200).json(successResponse(result, "Employee deleted successfully"));
  } catch (err) {
    logger.error({
      apiId: "AUTH_DELETE_EMPLOYEE",
      action: "Delete employee",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      employeeId: id,
      error: err.message,
      message: "Failed to delete employee",
      env: ENV,
      service: SERVICE_NAME
    });

    return res.status(err.status || 500).json(errorResponse(err.message, "AUTH_DELETE_EMPLOYEE_FAILED"));
  }
};

const {
  getEmployeesService,
  getEmployeeByIdService
} = require("../services/auth.service.js");


module.exports.getEmployeesController = async (req, res) => {
  try {
    const data = await getEmployeesService();

    logger.info({
      apiId: "AUTH_GET_EMPLOYEES",
      action: "Fetch all employees",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      count: data.length,
      message: "Employees fetched successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(200)
      .json(successResponse(data, "Employees fetched successfully"));

  } catch (error) {
    logger.error({
      apiId: "AUTH_GET_EMPLOYEES",
      action: "Fetch all employees",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      error: error.message,
      message: "Failed to fetch employees",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(500)
      .json(errorResponse(error.message, "AUTH_GET_EMPLOYEES_FAILED"));
  }
};

module.exports.getEmployeeByIdController = async (req, res) => {
  const { id } = req.params;

  try {
    const data = await getEmployeeByIdService(id);

    if (!data) {
      logger.warn({
        apiId: "AUTH_GET_EMPLOYEE",
        action: "Fetch employee by ID",
        requestId: req.requestId,
        sessionId: req.sessionId,
        userId: req.user?.id,
        employeeId: id,
        message: "Employee not found",
        env: ENV,
        service: SERVICE_NAME
      });

      return res
        .status(404)
        .json(errorResponse("Employee not found", "AUTH_EMPLOYEE_NOT_FOUND"));
    }

    logger.info({
      apiId: "AUTH_GET_EMPLOYEE",
      action: "Fetch employee by ID",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      employeeId: id,
      message: "Employee fetched successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(200)
      .json(successResponse(data, "Employee fetched successfully"));

  } catch (error) {
    logger.error({
      apiId: "AUTH_GET_EMPLOYEE",
      action: "Fetch employee by ID",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      employeeId: id,
      error: error.message,
      message: "Failed to fetch employee",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(500)
      .json(errorResponse(error.message, "AUTH_GET_EMPLOYEE_FAILED"));
  }
};

module.exports.updateEmployeeController = async (req, res) => {
  const { id } = req.params;

  try {
    const files = req.files || {};
    const toUrlPath = (file) =>
      file?.filename
        ? path.posix.join("/uploads/employees", file.filename)
        : undefined;

    const payload = {
      ...req.body,
      aadhar_path: files.aadhar_file ? toUrlPath(files.aadhar_file[0]) : undefined,
      pan_path: files.pan_file ? toUrlPath(files.pan_file[0]) : undefined,
    };

    const updated = await updateEmployeeService(id, payload);

    logger.info({
      apiId: "AUTH_UPDATE_EMPLOYEE",
      action: "Update employee",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      employeeId: id,
      message: "Employee updated successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res.status(200).json(successResponse(updated, "Employee updated successfully"));
  } catch (err) {
    logger.error({
      apiId: "AUTH_UPDATE_EMPLOYEE",
      action: "Update employee",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      employeeId: id,
      error: err.message,
      message: "Failed to update employee",
      env: ENV,
      service: SERVICE_NAME
    });

  return res.status(err.status || 500).json(errorResponse(err.message, "AUTH_UPDATE_EMPLOYEE_FAILED"));
  }
};

module.exports.forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await forgotPasswordService(email);
    return res.status(200).json(successResponse(result, "OTP sent successfully"));
  } catch (error) {
    return res.status(error.status || 500).json(errorResponse(error.message, "AUTH_FORGOT_PASSWORD_FAILED"));
  }
};

module.exports.verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyOTPService(email, otp);
    return res.status(200).json(successResponse(result, "OTP verified successfully"));
  } catch (error) {
    return res.status(error.status || 400).json(errorResponse(error.message, "AUTH_VERIFY_OTP_FAILED"));
  }
};

module.exports.resetPasswordController = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await resetPasswordService(email, otp, newPassword);
    return res.status(200).json(successResponse(result, "Password reset successfully"));
  } catch (error) {
    return res.status(error.status || 400).json(errorResponse(error.message, "AUTH_RESET_PASSWORD_FAILED"));
  }
};
