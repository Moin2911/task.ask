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

  return rows;
};


// GET EMPLOYEE BY ID
module.exports.getEmployeeById = async (id) => {
  const columns = await getEmployeeSelectColumns();
  const [rows] = await pool.execute(
    `SELECT ${columns.join(", ")} FROM users WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
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
