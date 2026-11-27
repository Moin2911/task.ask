const pool = require("../config/db.config.js");
const {
  ensureProjectAssignmentsTable,
} = require("./user.model.js");

let projectGridColumnPromise;

const ensureProjectGridColumn = async () => {
  if (!projectGridColumnPromise) {
    projectGridColumnPromise = (async () => {
      const [columns] = await pool.execute(
        "SHOW COLUMNS FROM projects LIKE 'show_in_grid'"
      );

      if (columns.length === 0) {
        try {
          await pool.execute(
            "ALTER TABLE projects ADD COLUMN show_in_grid TINYINT(1) NOT NULL DEFAULT 1"
          );
        } catch (error) {
          if (error.code !== "ER_DUP_FIELDNAME") throw error;
        }
      }
    })().catch((error) => {
      projectGridColumnPromise = null;
      throw error;
    });
  }

  await projectGridColumnPromise;
};

// 👑 ADMIN / MANAGER → all projects
module.exports.getAllProjects = async () => {
  await ensureProjectGridColumn();
  const [rows] = await pool.execute(
    "SELECT * FROM projects ORDER BY id DESC"
  );
  return rows;
};

// 👨‍💻 USER → projects explicitly assigned to the user
module.exports.getProjectsByUser = async (userId) => {
  await ensureProjectGridColumn();
  await ensureProjectAssignmentsTable();
  const [rows] = await pool.execute(
    `
    SELECT *
    FROM (
      SELECT DISTINCT p.*
      FROM projects p
      JOIN user_project_assignments upa ON upa.project_id = p.id
      WHERE upa.user_id = ?

      UNION

      SELECT DISTINCT p.*
      FROM projects p
      JOIN users u ON u.project_id = p.id
      WHERE u.id = ?
    ) AS assigned_projects
    ORDER BY id DESC
    `,
    [userId, userId]
  );
  return rows;
};


module.exports.createProject = async (data) => {
  await ensureProjectGridColumn();
  const [result] = await pool.execute(
    `
    INSERT INTO projects (name, description, status, show_in_grid)
    VALUES (?, ?, ?, ?)
    `,
    [data.name, data.description, data.status, data.show_in_grid ? 1 : 0]
  );

  return {
    id: result.insertId,
    ...data
  };
};

module.exports.updateProject = async (projectId, data) => {
  await ensureProjectGridColumn();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `
      UPDATE projects
      SET name = ?, description = ?, status = ?, show_in_grid = ?
      WHERE id = ?
      `,
      [
        data.name,
        data.description,
        data.status,
        data.show_in_grid ? 1 : 0,
        projectId,
      ]
    );

    if (data.previous_name && data.previous_name !== data.name) {
      await connection.execute(
        "UPDATE notes SET project_name = ? WHERE project_name = ?",
        [data.name, data.previous_name]
      );
    }

    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  await ensureProjectGridColumn();
  const [result] = await pool.execute(
    "DELETE FROM projects WHERE id = ?",
    [projectId]
  );
  return result;
};
