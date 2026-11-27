const pool = require("../config/db.config.js");

const requiredEmployeeColumns = ["id", "name", "email", "role", "phone", "status", "created_at"];
const optionalEmployeeColumns = [
  "project_id",
  "priority",
  "aadhar_path",
  "pan_path",
  "bank_account_name",
  "bank_account_number",
  "bank_ifsc",
];

let cachedUserColumns = null;
let userColumnsPromise = null;
let cachedProjectAssignmentsReady = false;
let projectAssignmentsPromise = null;

const getUserColumnSet = async () => {
  if (cachedUserColumns) return cachedUserColumns;
  if (!userColumnsPromise) {
    userColumnsPromise = pool
      .query("SHOW COLUMNS FROM users")
      .then(([rows]) => {
        const columnSet = new Set(rows.map((row) => row.Field));
        cachedUserColumns = columnSet;
        return columnSet;
      })
      .catch((error) => {
        userColumnsPromise = null;
        throw error;
      });
  }
  return userColumnsPromise;
};

const getEmployeeSelectColumns = async () => {
  const columnSet = await getUserColumnSet();
  return requiredEmployeeColumns.concat(
    optionalEmployeeColumns.filter((column) => columnSet.has(column)),
  );
};

const filterFieldsToExistingColumns = async (fields = {}) => {
  const columnSet = await getUserColumnSet();
  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => columnSet.has(key)),
  );
};

const ensureProjectAssignmentsTable = async () => {
  if (cachedProjectAssignmentsReady) return true;
  if (!projectAssignmentsPromise) {
    projectAssignmentsPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS user_project_assignments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          project_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uniq_user_project (user_id, project_id)
        )
      `)
      .then(() => {
        cachedProjectAssignmentsReady = true;
        return true;
      })
      .catch((error) => {
        projectAssignmentsPromise = null;
        throw error;
      });
  }

  return projectAssignmentsPromise;
};

const parseIdList = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  if (value === undefined || value === null || value === "") return [];

  return String(value)
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const hydrateRowsWithProjects = async (rows = []) => {
  if (!rows.length) return [];

  await ensureProjectAssignmentsTable();

  const userIds = rows
    .map((row) => Number(row.id))
    .filter((id) => Number.isFinite(id) && id > 0);

  let assignmentRows = [];
  if (userIds.length > 0) {
    const placeholders = userIds.map(() => "?").join(", ");
    [assignmentRows] = await pool.execute(
      `
        SELECT
          upa.user_id,
          upa.project_id,
          p.name AS project_name
        FROM user_project_assignments upa
        LEFT JOIN projects p ON p.id = upa.project_id
        WHERE upa.user_id IN (${placeholders})
        ORDER BY upa.project_id ASC
      `,
      userIds
    );
  }

  const grouped = assignmentRows.reduce((acc, row) => {
    const userId = Number(row.user_id);
    if (!acc[userId]) {
      acc[userId] = { project_ids: [], project_names: [] };
    }
    acc[userId].project_ids.push(Number(row.project_id));
    if (row.project_name) {
      acc[userId].project_names.push(row.project_name);
    }
    return acc;
  }, {});

  return rows.map((row) => {
    const assignments = grouped[Number(row.id)] || { project_ids: [], project_names: [] };
    const fallbackProjectId = Number(row.project_id);
    const fallbackProjectName = row.project_name;
    const projectIds = assignments.project_ids.length
      ? assignments.project_ids
      : Number.isFinite(fallbackProjectId) && fallbackProjectId > 0
        ? [fallbackProjectId]
        : [];
    const projectNames = assignments.project_names.length
      ? assignments.project_names
      : fallbackProjectName
        ? [fallbackProjectName]
        : [];

    return {
      ...row,
      project_ids: projectIds,
      project_names: projectNames,
      projects: projectNames.map((name, index) => ({
        id: projectIds[index] || null,
        name,
      })),
    };
  });
};

// module.exports.createUser = async (user) => {
//   const {
//     name,
//     email,
//     password,
//     role,
//     phone,
//     project_id,
//     priority
//   } = user;

//   const [result] = await pool.execute(
//     `INSERT INTO users
//      (name, email, password, role, phone, project_id, priority)
//      VALUES (?, ?, ?, ?, ?, ?, ?)`,
//     [name, email, password, role, phone, project_id, priority]
//   );

//   return {
//     id: result.insertId,
//     name,
//     email,
//     role,
//     phone,
//     project_id,
//     priority
//   };
// };

module.exports.createUser = async (user) => {
  const { name, email, password, role, phone } = user;
  const columnSet = await getUserColumnSet();
  const insertColumns = ["name", "email", "password", "role", "phone"];
  const values = [name, email, password, role, phone];

  const optionalInsertFields = {
    project_id: user.project_id,
    priority: user.priority,
    aadhar_path: user.aadhar_path,
    pan_path: user.pan_path,
    bank_account_name: user.bank_account_name,
    bank_account_number: user.bank_account_number,
    bank_ifsc: user.bank_ifsc,
  };

  Object.entries(optionalInsertFields).forEach(([column, value]) => {
    if (columnSet.has(column)) {
      insertColumns.push(column);
      values.push(value ?? null);
    }
  });

  const placeholders = insertColumns.map(() => "?").join(", ");

  const [result] = await pool.execute(
    `INSERT INTO users (${insertColumns.join(", ")}) VALUES (${placeholders})`,
    values,
  );

  return {
    id: result.insertId,
    name,
    email,
    role,
    phone,
  };
};

module.exports.ensureProjectAssignmentsTable = ensureProjectAssignmentsTable;

module.exports.parseIdList = parseIdList;

module.exports.getProjectAssignmentsByUserId = async (userId) => {
  await ensureProjectAssignmentsTable();
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0) return [];

  const [rows] = await pool.execute(
    `
      SELECT
        upa.project_id,
        p.name AS project_name
      FROM user_project_assignments upa
      LEFT JOIN projects p ON p.id = upa.project_id
      WHERE upa.user_id = ?
      ORDER BY upa.project_id ASC
    `,
    [numericUserId]
  );

  return rows;
};

module.exports.setUserProjectAssignments = async (userId, projectIds = []) => {
  await ensureProjectAssignmentsTable();
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0) return [];

  const uniqueProjectIds = Array.from(
    new Set(parseIdList(projectIds))
  );

  await pool.execute(
    "DELETE FROM user_project_assignments WHERE user_id = ?",
    [numericUserId]
  );

  if (uniqueProjectIds.length === 0) {
    return [];
  }

  const placeholders = uniqueProjectIds.map(() => "(?, ?)").join(", ");
  const values = uniqueProjectIds.flatMap((projectId) => [numericUserId, projectId]);

  await pool.execute(
    `INSERT INTO user_project_assignments (user_id, project_id) VALUES ${placeholders}`,
    values
  );

  return uniqueProjectIds;
};


module.exports.findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
};

module.exports.deleteUserById = async (id) => {
  const [result] = await pool.execute(
    "DELETE FROM users WHERE id = ?",
    [id]
  );

  return result.affectedRows;
};


// GET ALL EMPLOYEES
module.exports.getAllEmployees = async () => {
  const columns = await getEmployeeSelectColumns();
  const [rows] = await pool.execute(
    `SELECT ${columns.join(", ")} FROM users`,
  );

  return hydrateRowsWithProjects(rows);
};


// GET EMPLOYEE BY ID
module.exports.getEmployeeById = async (id) => {
  const columns = await getEmployeeSelectColumns();
  const [rows] = await pool.execute(
    `SELECT ${columns.join(", ")} FROM users WHERE id = ?`,
    [id],
  );

  const [row] = rows;
  if (!row) return null;
  const [hydrated] = await hydrateRowsWithProjects([row]);
  return hydrated || null;
};

module.exports.updateEmployeeById = async (id, fields) => {
  const filteredFields = await filterFieldsToExistingColumns(fields);
  const keys = Object.keys(filteredFields);
  if (keys.length === 0) return 0;

  const setSql = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => filteredFields[key]);

  const [result] = await pool.execute(
    `UPDATE users SET ${setSql} WHERE id = ?`,
    [...values, id]
  );

  return result.affectedRows;
};

module.exports.setUserOTP = async (email, otp, expiry) => {
  const [result] = await pool.execute(
    "UPDATE users SET otp = ?, otp_expiry = ? WHERE email = ?",
    [otp, expiry, email]
  );
  return result.affectedRows;
};

module.exports.findUserByOTP = async (email, otp) => {
  const [rows] = await pool.execute(
    "SELECT * FROM users WHERE email = ? AND otp = ? AND otp_expiry > NOW()",
    [email, otp]
  );
  return rows[0] || null;
};

module.exports.resetUserPassword = async (email, hashedPassword) => {
  const [result] = await pool.execute(
    "UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?",
    [hashedPassword, email]
  );
  return result.affectedRows;
};
