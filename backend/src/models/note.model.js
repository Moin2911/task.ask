const pool = require("../config/db.config.js");

module.exports.createNote = async ({ projectName, note, userId }) => {
  const [result] = await pool.execute(
    `
    INSERT INTO notes (project_name, note, created_by, updated_by)
    VALUES (?, ?, ?, ?)
    `,
    [projectName, note, userId || null, userId || null]
  );

  return {
    id: result.insertId,
    project_name: projectName,
    note,
    created_by: userId || null,
    updated_by: userId || null,
  };
};

module.exports.getAllNotes = async () => {
  const [rows] = await pool.execute(
    `
    SELECT id, project_name, note, created_by, updated_by, created_at, updated_at
    FROM notes
    ORDER BY id DESC
    `
  );

  return rows;
};

module.exports.getNoteById = async (id) => {
  const [rows] = await pool.execute(
    `
    SELECT id, project_name, note, created_by, updated_by, created_at, updated_at
    FROM notes
    WHERE id = ?
    LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

module.exports.updateNoteById = async (id, { projectName, note, userId }) => {
  const fields = [];
  const values = [];

  if (projectName !== undefined) {
    fields.push("project_name = ?");
    values.push(projectName);
  }

  if (note !== undefined) {
    fields.push("note = ?");
    values.push(note);
  }

  if (userId !== undefined) {
    fields.push("updated_by = ?");
    values.push(userId || null);
  }

  if (!fields.length) return 0;

  const [result] = await pool.execute(
    `UPDATE notes SET ${fields.join(", ")} WHERE id = ?`,
    [...values, id]
  );

  return result.affectedRows;
};

module.exports.deleteNoteById = async (id) => {
  const [result] = await pool.execute(
    "DELETE FROM notes WHERE id = ?",
    [id]
  );

  return result.affectedRows;
};
