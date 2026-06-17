
const logger = require("../config/logger.config.js");
const {
  successResponse,
  errorResponse
} = require("../utils/response.util.js");

const {
  createProjectService,
  getProjectsService,
  deleteProjectService,
  upsertProjectMasterService,
  getProjectMasterService,
} = require("../services/project.service.js");

const SERVICE_NAME = "ask-innovation-backend";
const ENV = process.env.NODE_ENV || "dev";


module.exports.createProjectController = async (req, res) => {
  try {

    const data = await createProjectService(req.body, req.user);

    logger.info({
      apiId: "PROJECT_CREATE",
      action: "Create project",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      message: "Project created successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(201)
      .json(successResponse(data, "Project created successfully"));

  } catch (error) {

    logger.error({
      apiId: "PROJECT_CREATE",
      action: "Create project failed",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      error: error.message,
      message: "Project creation failed",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(error.status || 500)
      .json(errorResponse(error.message, "PROJECT_CREATE_FAILED"));
  }
};


module.exports.getProjectsController = async (req, res) => {
  try {
    const data = await getProjectsService(req.user, {
      scope: req.query.scope,
    });

    logger.info({
      apiId: "PROJECT_GET",
      action: "Get projects",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      role: req.user?.role,
      message: "Projects fetched successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(200)
      .json(successResponse(data, "Projects fetched"));

  } catch (error) {

    logger.error({
      apiId: "PROJECT_GET",
      action: "Get projects failed",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      error: error.message,
      message: "Failed to fetch projects",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(500)
      .json(errorResponse(error.message, "PROJECT_FETCH_FAILED"));
  }
};

module.exports.deleteProjectController = async (req, res) => {
  try {
    const data = await deleteProjectService(req.params.id, req.user);

    logger.info({
      apiId: "PROJECT_DELETE",
      action: "Delete project",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      message: "Project deleted successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(200)
      .json(successResponse(data, "Project deleted successfully"));
  } catch (error) {
    logger.error({
      apiId: "PROJECT_DELETE",
      action: "Delete project failed",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      error: error.message,
      message: "Project deletion failed",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(error.status || 500)
      .json(errorResponse(error.message, "PROJECT_DELETE_FAILED"));
  }
};

module.exports.upsertProjectMasterController = async (req, res) => {
  try {
    const data = await upsertProjectMasterService(req.body, req.user);

    logger.info({
      apiId: "PROJECT_MASTER_UPSERT",
      action: "Upsert project master value",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      message: "Project master value saved successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(200)
      .json(successResponse(data, "Project master value saved successfully"));
  } catch (error) {
    logger.error({
      apiId: "PROJECT_MASTER_UPSERT",
      action: "Upsert project master value failed",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      error: error.message,
      message: "Failed to save project master value",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(error.status || 500)
      .json(errorResponse(error.message, "PROJECT_MASTER_UPSERT_FAILED"));
  }
};

module.exports.getProjectMasterController = async (req, res) => {
  try {
    const data = await getProjectMasterService(req.query.project_id);

    logger.info({
      apiId: "PROJECT_MASTER_GET",
      action: "Get project master value",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      message: "Project master value fetched successfully",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(200)
      .json(successResponse(data, "Project master value fetched successfully"));
  } catch (error) {
    logger.error({
      apiId: "PROJECT_MASTER_GET",
      action: "Get project master value failed",
      requestId: req.requestId,
      sessionId: req.sessionId,
      userId: req.user?.id,
      error: error.message,
      message: "Failed to fetch project master value",
      env: ENV,
      service: SERVICE_NAME
    });

    return res
      .status(error.status || 500)
      .json(errorResponse(error.message, "PROJECT_MASTER_GET_FAILED"));
  }
};









module.exports.helloController = async () => {
  try {
    const data = getHelloService();

    logger.info("Hello API called", { data });

    return {
      status: 200,
      body: successResponse(data)
    };
  } catch (error) {
    logger.error("Hello API error", {
      message: error.message,
      stack: error.stack
    });

    return {
      status: 500,
      body: errorResponse()
    };
  }
};
