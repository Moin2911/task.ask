const taskModel = require("../models/task.model.js");
const commentModel = require("../models/comment.model.js");

const KANBAN_STATUS_MAP = {
  pending: ["pending", "todo", "to do"],
  in_progress: ["in progress", "progress"],
  completed: ["completed", "done", "complete"]
};

async function addTask(data) {
  return await taskModel.createTask(data);
}

async function fetchTasks(page, limit, search = "") {

  const offset = (page - 1) * limit;
  const cleanSearch = String(search || "").trim();

  const tasks = await taskModel.getTasks(limit, offset, cleanSearch);
  const total = await taskModel.getTasksCount(cleanSearch);

  const totalPages = Math.ceil(total / limit);

  return {
    tasks,
    total,
    page,
    limit,
    totalPages
  };
}

async function fetchTasksByUser(userId, page, limit, search = "") {

  const offset = (page - 1) * limit;
  const cleanSearch = String(search || "").trim();

  const tasks = await taskModel.getTasksByUser(userId, limit, offset, cleanSearch);
  const total = await taskModel.getTasksCountByUser(userId, cleanSearch);

  const totalPages = Math.ceil(total / limit);

  return {
    tasks,
    total,
    page,
    limit,
    totalPages
  };
}
async function deleteTask(taskId, user) {

  const task = await taskModel.getTaskById(taskId);

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  if (user.role === "admin") {
    await commentModel.deleteCommentsByTaskId(taskId);
    return await taskModel.deleteTaskById(taskId);
  }

  if (task.assigned_to !== user.id) {
    throw new Error("FORBIDDEN");
  }

  await commentModel.deleteCommentsByTaskId(taskId);
  return await taskModel.deleteTaskById(taskId);
}


async function updateTaskStatus(taskId, status, user) {

  const task = await taskModel.getTaskById(taskId);

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  if (user.role === "admin") {
    return await taskModel.updateTaskStatusById(taskId, status);
  }

  if (task.assigned_to !== user.id) {
    throw new Error("FORBIDDEN");
  }

  return await taskModel.updateTaskStatusById(taskId, status);
}

async function fetchKanbanTasksByCategory(user, category, page, limit, filters = {}) {
  const normalizedStatuses = KANBAN_STATUS_MAP[category];

  if (!normalizedStatuses) {
    throw new Error("INVALID_KANBAN_CATEGORY");
  }

  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;
  const offset = (safePage - 1) * safeLimit;

  const cleanedFilters = {
    project: filters.project ? String(filters.project).trim() : "",
    employee: filters.employee ? String(filters.employee).trim() : "",
    search: filters.search ? String(filters.search).trim() : ""
  };

  const tasks = await taskModel.getKanbanTasksByStatuses(
    user,
    normalizedStatuses,
    safeLimit,
    offset,
    cleanedFilters
  );

  const total = await taskModel.getKanbanTasksCountByStatuses(
    user,
    normalizedStatuses,
    cleanedFilters
  );

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    tasks,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages
  };
}


async function fetchTaskHistory(user, filters = {}) {
  const queryFilters = { ...filters };
  
  if (user.role !== "admin") {
    queryFilters.userId = user.id;
  }

  return await taskModel.getTaskHistory(queryFilters);
}


module.exports = {
  addTask,
  fetchTasks,
  fetchTasksByUser,
  deleteTask,
  updateTaskStatus,
  fetchKanbanTasksByCategory,
  fetchTaskHistory
};
