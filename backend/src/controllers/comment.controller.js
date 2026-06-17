const logger = require("../config/logger.config.js");
const {
  addCommentService,
  getTaskCommentsService,
  getAllCommentsService
} = require("../services/comment.service.js");

const getStatusAndMessage = (error) => {
  if (error.message === "COMMENT_REQUIRED") {
    return { status: 400, message: "Comment is required" };
  }
  if (error.message === "TASK_NOT_FOUND") {
    return { status: 404, message: "Task not found" };
  }
  if (error.message === "FORBIDDEN") {
    return { status: 403, message: "You are not allowed to access this task comments" };
  }
  if (error.message === "Unauthorized") {
    return { status: 403, message: "Unauthorized" };
  }
  return { status: 500, message: "Internal server error" };
};

// Add comment
module.exports.addCommentController = async (req, res) => {
  const { taskId } = req.params;
  const { comment } = req.body;
  const user = req.user;

  try {
    const data = await addCommentService(user, taskId, comment);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId: "COMMENT_TASK",
      action: "add comment",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: user.id,
      message: `Comment added for task ${taskId}`
    });

    res.status(201).json({ success: true, data });

  } catch (error) {
    const { status, message } = getStatusAndMessage(error);

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "task-service",
      env: process.env.NODE_ENV,
      apiId: "COMMENT_TASK",
      action: "add comment",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: user.id,
      error: error.message
    });

    res.status(status).json({ success: false, message });
  }
};

// Get comments for a task + count
module.exports.getCommentsController = async (req, res) => {
  const { taskId } = req.params;
  const user = req.user;

  try {
    const data = await getTaskCommentsService(user, taskId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const { status, message } = getStatusAndMessage(error);
    res.status(status).json({ success: false, message });
  }
};

// Admin get all comments + overall count
module.exports.getAllCommentsController = async (req, res) => {
  const user = req.user;

  try {
    const data = await getAllCommentsService(user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const { status, message } = getStatusAndMessage(error);
    res.status(status).json({ success: false, message });
  }
};
