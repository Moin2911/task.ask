const db = require("../config/db.config.js");

// CREATE TASK
module.exports.createTask = async (data) => {
  const sql = `
    INSERT INTO tasks
    (title, description, project_id, assigned_to, priority, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(sql, [
    data.title,
    data.description,
    data.project_id,
    data.assigned_to,
    data.priority || "medium",
    data.status || "pending",
    data.due_date || null,
  ]);

  return result.insertId;
};

// GET ALL TASKS (with optional text search on title/description)
module.exports.getTasks = async (limit, offset, search = "") => {
  const hasSearch = String(search || "").trim().length > 0;
  const searchPattern = `%${String(search || "").trim().toLowerCase()}%`;

  const sql = `
    SELECT
      t.*,
      p.name AS project_name,
      u.name AS assigned_user,
      IFNULL(c.comment_count, 0) AS comment_count
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN users u ON t.assigned_to = u.id
    LEFT JOIN (
      SELECT task_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY task_id
    ) c ON c.task_id = t.id
    WHERE (
      ? = ''
      OR LOWER(t.title) LIKE ?
      OR LOWER(IFNULL(t.description, '')) LIKE ?
    )
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.execute(sql, [
    hasSearch ? searchPattern : "",
    hasSearch ? searchPattern : "",
    hasSearch ? searchPattern : "",
    limit,
    offset,
  ]);
  return rows;
};

module.exports.getTasksCount = async (search = "") => {
  const hasSearch = String(search || "").trim().length > 0;
  const searchPattern = `%${String(search || "").trim().toLowerCase()}%`;

  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM tasks
     WHERE (
      ? = ''
      OR LOWER(title) LIKE ?
      OR LOWER(IFNULL(description, '')) LIKE ?
     )`,
    [
      hasSearch ? searchPattern : "",
      hasSearch ? searchPattern : "",
      hasSearch ? searchPattern : "",
    ]
  );
  return rows[0].total;
};

module.exports.getTasksByUser = async (userId, limit, offset, search = "") => {
  const hasSearch = String(search || "").trim().length > 0;
  const searchPattern = `%${String(search || "").trim().toLowerCase()}%`;

  const sql = `
    SELECT
      t.*,
      p.name AS project_name,
      u.name AS assigned_user,
      IFNULL(c.comment_count, 0) AS comment_count
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN users u ON t.assigned_to = u.id
    LEFT JOIN (
      SELECT task_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY task_id
    ) c ON c.task_id = t.id
    WHERE t.assigned_to = ?
      AND (
        ? = ''
        OR LOWER(t.title) LIKE ?
        OR LOWER(IFNULL(t.description, '')) LIKE ?
      )
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.execute(sql, [
    userId,
    hasSearch ? searchPattern : "",
    hasSearch ? searchPattern : "",
    hasSearch ? searchPattern : "",
    limit,
    offset,
  ]);
  return rows;
};
module.exports.getTasksCountByUser = async (userId, search = "") => {
  const hasSearch = String(search || "").trim().length > 0;
  const searchPattern = `%${String(search || "").trim().toLowerCase()}%`;

  const [rows] = await db.execute(
    `SELECT COUNT(*) AS total
     FROM tasks
     WHERE assigned_to = ?
       AND (
         ? = ''
         OR LOWER(title) LIKE ?
         OR LOWER(IFNULL(description, '')) LIKE ?
       )`,
    [
      userId,
      hasSearch ? searchPattern : "",
      hasSearch ? searchPattern : "",
      hasSearch ? searchPattern : "",
    ]
  );
  return rows[0].total;
};

module.exports.getTaskById = async (taskId) => {
  const sql = "SELECT * FROM tasks WHERE id = ?";
  const [rows] = await db.execute(sql, [taskId]);
  return rows[0];
};

module.exports.deleteTaskById = async (taskId) => {
  const sql = "DELETE FROM tasks WHERE id = ?";
  const [result] = await db.execute(sql, [taskId]);
  return result.affectedRows;
};


// UPDATE TASK STATUS
module.exports.updateTaskStatusById = async (taskId, status) => {
  const sql = `
    UPDATE tasks
    SET status = ?, updated_at = NOW()
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [status, taskId]);

  return result.affectedRows;
};

const buildKanbanTaskWhere = (user, normalizedStatuses, filters = {}) => {
  const clauses = [];
  const params = [];

  const statusPlaceholders = normalizedStatuses.map(() => "?").join(", ");
  clauses.push(
    `LOWER(REPLACE(TRIM(t.status), '_', ' ')) IN (${statusPlaceholders})`
  );
  params.push(...normalizedStatuses);

  if (user.role !== "admin") {
    clauses.push("t.assigned_to = ?");
    params.push(user.id);
  }

  if (filters.project) {
    clauses.push("LOWER(p.name) = ?");
    params.push(String(filters.project).toLowerCase());
  }

  if (filters.employee) {
    clauses.push("LOWER(u.name) = ?");
    params.push(String(filters.employee).toLowerCase());
  }

  if (filters.search) {
    clauses.push(
      "(LOWER(t.title) LIKE ? OR LOWER(IFNULL(t.description, '')) LIKE ?)"
    );
    const searchPattern = `%${String(filters.search).toLowerCase()}%`;
    params.push(searchPattern, searchPattern);
  }

  return {
    whereSql: clauses.join(" AND "),
    params
  };
};

module.exports.getKanbanTasksByStatuses = async (
  user,
  normalizedStatuses,
  limit,
  offset,
  filters = {}
) => {
  const { whereSql, params } = buildKanbanTaskWhere(
    user,
    normalizedStatuses,
    filters
  );

  const sql = `
    SELECT
      t.*,
      p.name AS project_name,
      u.name AS assigned_user,
      IFNULL(c.comment_count, 0) AS comment_count
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN users u ON t.assigned_to = u.id
    LEFT JOIN (
      SELECT task_id, COUNT(*) AS comment_count
      FROM comments
      GROUP BY task_id
    ) c ON c.task_id = t.id
    WHERE ${whereSql}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.execute(sql, [...params, limit, offset]);
  return rows;
};

module.exports.getKanbanTasksCountByStatuses = async (
  user,
  normalizedStatuses,
  filters = {}
) => {
  const { whereSql, params } = buildKanbanTaskWhere(
    user,
    normalizedStatuses,
    filters
  );

  const sql = `
    SELECT COUNT(*) AS total
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN users u ON t.assigned_to = u.id
    WHERE ${whereSql}
  `;

  const [rows] = await db.execute(sql, params);
  return rows[0].total;
};

module.exports.getTaskHistory = async (filters = {}) => {
  const clauses = [];
  const params = [];

  const dateCol = "IFNULL(t.due_date, t.created_at)";
  const normalizedDate = filters.date || null;
  const normalizedStartDate = filters.startDate || normalizedDate || null;
  const normalizedEndDate = filters.endDate || normalizedDate || null;

  if (normalizedStartDate || normalizedEndDate) {
    const startDate = normalizedStartDate || normalizedEndDate;
    const endDate = normalizedEndDate || normalizedStartDate;
    clauses.push(`DATE(${dateCol}) BETWEEN ? AND ?`);
    params.push(startDate, endDate);
  } else {
    // default to today
    clauses.push(`DATE(${dateCol}) = DATE(NOW())`);
  }

  if (filters.userId) {
    clauses.push("t.assigned_to = ?");
    params.push(filters.userId);
  }

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT 
      t.*,
      p.name AS project_name,
      u.name AS assigned_user,
      DATE(${dateCol}) as task_date
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    JOIN users u ON t.assigned_to = u.id
    ${whereSql}
    ORDER BY DATE(${dateCol}) DESC, t.created_at DESC
  `;

  const [rows] = await db.execute(sql, params);
  return rows;
};
