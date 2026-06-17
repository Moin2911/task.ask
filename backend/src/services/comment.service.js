const {
  addComment,
  getCommentsByTask,
  getAllComments,
  getCommentCountByTask,
  getOverallCommentCount,
  getUserTotalCommentCount
} = require("../models/comment.model.js");
const { getTaskById } = require("../models/task.model.js");

const assertTaskCommentAccess = async (user, taskId) => {
  const task = await getTaskById(taskId);

  if (!task) throw new Error("TASK_NOT_FOUND");

  if (user.role === "admin") return task;

  if (Number(task.assigned_to) !== Number(user.id)) {
    throw new Error("FORBIDDEN");
  }

  return task;
};

// Add a new comment for a task
module.exports.addCommentService = async (user, taskId, commentText) => {
  const safeComment = typeof commentText === "string" ? commentText.trim() : "";
  if (!safeComment) throw new Error("COMMENT_REQUIRED");

  await assertTaskCommentAccess(user, taskId);
  const inserted = await addComment(taskId, user.id, safeComment);

  return {
    id: inserted.id,
    taskId: Number(taskId),
    userId: user.id,
    comment: safeComment
  };
};

// Get comments for a task + all counts
module.exports.getTaskCommentsService = async (user, taskId) => {
  await assertTaskCommentAccess(user, taskId);

  const comments = await getCommentsByTask(taskId);
  const taskTotal = await getCommentCountByTask(taskId);
  const userTotal = await getUserTotalCommentCount(user.id);
  const overallTotal = await getOverallCommentCount();

  return {
    taskTotalComments: taskTotal,
    userTotalComments: userTotal,
    overallTotalComments: overallTotal,
    comments
  };
};

// Admin gets all comments + overall count
module.exports.getAllCommentsService = async (user) => {
  if (user.role !== "admin") throw new Error("Unauthorized");

  const comments = await getAllComments();
  const total = await getOverallCommentCount();

  return {
    overallTotalComments: total,
    comments
  };
};
