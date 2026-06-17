const taskService = require("../services/task.service.js");
const logger = require("../config/logger.config.js");

const parseKanbanFilters = (query = {}) => {
  const normalize = (value) => {
    if (!value) return "";
    const trimmed = String(value).trim();
    if (!trimmed) return "";
    if (trimmed.toLowerCase() === "all") return "";
    return trimmed;
  };

  return {
    project: normalize(query.project),
    employee: normalize(query.employee),
    search: normalize(query.search)
  };
};

const buildKanbanController = (category, apiId) => {
  return async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const filters = parseKanbanFilters(req.query);

      const result = await taskService.fetchKanbanTasksByCategory(
        req.user,
        category,
        page,
        limit,
        filters
      );

      logger.info({
        timestamp: new Date().toISOString(),
        level: "info",
        service: "task-service",
        env: process.env.NODE_ENV,
        apiId,
        action: "get kanban tasks by status",
        requestId: req.requestId,
        sessionId: req.sessionId || null,
        userId: req.user?.id || null,
      });

      return res.status(200).json({
        success: true,
        data: result.tasks,
        pagination: {
          totalTasks: result.total,
          totalPages: result.totalPages,
          currentPage: result.page,
          limit: result.limit
        }
      });
    } catch (error) {
      logger.error({
        timestamp: new Date().toISOString(),
        level: "error",
        service: "task-service",
        env: process.env.NODE_ENV,
        apiId,
        action: "get kanban tasks by status failed",
        requestId: req.requestId,
        sessionId: req.sessionId || null,
        userId: req.user?.id || null,
        error: error.message,
      });

      if (error.message === "INVALID_KANBAN_CATEGORY") {
        return res.status(400).json({
          success: false,
          message: "Invalid kanban category"
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  };
};

module.exports.createTaskController = async (req, res) => {
  const apiId = "CREATE_TASK";

  try {
    const taskId = await taskService.addTask(req.body);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "create task",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.userId || null,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      taskId,
    });

  } catch (error) {

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "create task failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.userId || null,
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports.getTasksController = async (req, res) => {
  const apiId = "GET_TASKS";

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || "").trim();

    const result = await taskService.fetchTasks(page, limit, search);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get tasks with pagination",
      requestId: req.requestId,
    });

    return res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: {
        totalTasks: result.total,
        totalPages: result.totalPages,
        currentPage: result.page,
        limit: result.limit,
      }
    });

  } catch (error) {

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get tasks failed",
      requestId: req.requestId,
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


module.exports.getMyTasksController = async (req, res) => {
  const apiId = "GET_MY_TASKS";

  try {
    const userId = req.user?.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || "").trim();

    const result = await taskService.fetchTasksByUser(userId, page, limit, search);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get my tasks with pagination",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId,
    });

    return res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });

  } catch (error) {

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get my tasks failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports.deleteTaskController = async (req, res) => {
  const apiId = "DELETE_TASK";

  try {
    const taskId = req.params.id;

    await taskService.deleteTask(taskId, req.user);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "delete task",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully"
    });

  } catch (error) {

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "delete task failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
      error: error.message,
    });

    if (error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this task"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports.updateTaskStatusController = async (req, res) => {
  const apiId = "UPDATE_TASK_STATUS";

  try {
    const taskId = req.params.id;
    const { status } = req.body;
    console.log("update controller", taskId, status, req.user)
    await taskService.updateTaskStatus(taskId, status, req.user);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "update task status",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Task status updated successfully"
    });

  } catch (error) {

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "update task status failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
      error: error.message,
    });

    if (error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this task"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports.getKanbanPendingTasksController = buildKanbanController(
  "pending",
  "GET_KANBAN_PENDING_TASKS"
);

module.exports.getKanbanInProgressTasksController = buildKanbanController(
  "in_progress",
  "GET_KANBAN_IN_PROGRESS_TASKS"
);

module.exports.getKanbanCompletedTasksController = buildKanbanController(
  "completed",
  "GET_KANBAN_COMPLETED_TASKS"
);

module.exports.getTaskHistoryController = async (req, res) => {
  const apiId = "GET_TASK_HISTORY";
  try {
    const filters = {
      date: req.query.date,
      userId: req.query.userId // Admin can pass this
    };

    const tasks = await taskService.fetchTaskHistory(req.user, filters);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get task history",
      requestId: req.requestId,
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get task history failed",
      requestId: req.requestId,
      error: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
