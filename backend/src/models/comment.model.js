const pool = require("../config/db.config.js");

// Add a new comment entry for a task
module.exports.addComment = async (taskId, userId, comment) => {
    const [result] = await pool.execute(
        `INSERT INTO comments (task_id, user_id, comment)
         VALUES (?, ?, ?)`,
        [taskId, userId, comment]
    );
    return { id: result.insertId };
};

// Get comments by task
module.exports.getCommentsByTask = async (taskId) => {
    const [rows] = await pool.execute(
        `SELECT
            c.id,
            c.task_id,
            c.user_id,
            c.comment,
            c.created_at,
            c.updated_at,
            u.name AS user_name,
            u.role AS user_role
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.task_id = ?
         ORDER BY c.created_at ASC, c.id ASC`,
        [taskId]
    );
    return rows;
};

// Get all comments (for admin)
module.exports.getAllComments = async () => {
    const [rows] = await pool.execute(
        `SELECT
            c.id,
            c.task_id,
            c.user_id,
            c.comment,
            c.created_at,
            c.updated_at,
            u.name AS user_name,
            u.role AS user_role,
            t.title AS task_title
         FROM comments c
         JOIN users u ON c.user_id = u.id
         JOIN tasks t ON c.task_id = t.id
         ORDER BY c.created_at DESC, c.id DESC`
    );
    return rows;
};

// Delete all comments for a task
module.exports.deleteCommentsByTaskId = async (taskId) => {
  const [result] = await pool.execute(
    "DELETE FROM comments WHERE task_id = ?",
    [taskId]
  );
  return result.affectedRows;
};


// Total comments for ONE task
module.exports.getCommentCountByTask = async (taskId) => {
    const [rows] = await pool.execute(
        `SELECT COUNT(*) AS total_comments
     FROM comments
     WHERE task_id = ?`,
        [taskId]
    );

    return rows[0].total_comments;
};

// Overall total comments (ALL tasks)
module.exports.getOverallCommentCount = async () => {
    const [rows] = await pool.execute(
        `SELECT COUNT(*) AS total_comments FROM comments`
    );

    return rows[0].total_comments;
};

// Total comments by user (all tasks)
module.exports.getUserTotalCommentCount = async (userId) => {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS total FROM comments WHERE user_id = ?",
    [userId]
  );

  return rows[0].total;
};
