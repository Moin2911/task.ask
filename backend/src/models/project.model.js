const pool = require("../config/db.config.js");

// 👑 ADMIN → all projects
module.exports.getAllProjects = async () => {
  const [rows] = await pool.execute(
    "SELECT * FROM projects ORDER BY id DESC"
  );
  return rows;
};

// 👨‍💻 USER → projects where user has tasks
module.exports.getProjectsByUser = async (userId) => {
  const [rows] = await pool.execute(
    `
    SELECT DISTINCT p.*
    FROM projects p
    JOIN tasks t ON p.id = t.project_id
    WHERE t.assigned_to = ?
    ORDER BY p.id DESC
    `,
    [userId]
  );
  return rows;
};


module.exports.createProject = async (data) => {
  const [result] = await pool.execute(
    `
    INSERT INTO projects (name, description, status)
    VALUES (?, ?, ?)
    `,
    [data.name, data.description, data.status]
  );

  return {
    id: result.insertId,
    ...data
  };
};

module.exports.upsertProjectMaster = async ({ projectId, value, userId }) => {
  const [result] = await pool.execute(
    `
    INSERT INTO project_master_values (project_id, value, created_by, updated_by)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      updated_by = VALUES(updated_by),
      updated_at = CURRENT_TIMESTAMP
    `,
    [projectId, value, userId, userId]
  );

  return {
    project_id: Number(projectId),
    value,
    affectedRows: result.affectedRows,
  };
};

module.exports.getProjectMasterByProjectId = async (projectId) => {
  const [rows] = await pool.execute(
    `
    SELECT
      pmv.id,
      pmv.project_id,
      pmv.value,
      pmv.created_by,
      pmv.updated_by,
      pmv.created_at,
      pmv.updated_at
    FROM project_master_values pmv
    WHERE pmv.project_id = ?
    LIMIT 1
    `,
    [projectId]
  );

  return rows[0] || null;
};

module.exports.deleteProject = async (projectId) => {
  const [result] = await pool.execute(
    "DELETE FROM projects WHERE id = ?",
    [projectId]
  );
  return result;
};
