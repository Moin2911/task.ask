const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  createUser,
  findUserByEmail,
  deleteUserById,
    getAllEmployees,
  getEmployeeById,
  updateEmployeeById,
  setUserOTP,
  findUserByOTP,
  resetUserPassword
} = require("../models/user.model.js");
const { sendMail } = require("../utils/mail.util.js");


const JWT_SECRET = process.env.JWT_SECRET;

const ALLOWED_ROLES = ["admin", "developer"];

module.exports.registerService = async (data) => {
  try {
    if (!ALLOWED_ROLES.includes(data.role)) {
      throw {
        status: 400,
        message: "This role is not allowed"
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await createUser({
      ...data,
      password: hashedPassword
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw {
        status: 409,
        message: "User already exists"
      };
    }
    throw err;
  }
};

module.exports.loginService = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Invalid credentials");

  if (user.status === "inactive") {
    throw new Error("Your account is inactive or deleted");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
       project_id: user.project_id  
    },
    JWT_SECRET,
    { expiresIn: "365d" }
  );
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    token
  };
};


module.exports.deleteEmployeeService = async (id) => {
  const deleted = await deleteUserById(id);

  if (!deleted) {
    throw {
      status: 404,
      message: "Employee not found"
    };
  }

  return { message: "Employee deleted successfully" };
};


exports.getEmployeesService = async () => {
  return await getAllEmployees();
};

exports.getEmployeeByIdService = async (id) => {
  return await getEmployeeById(id);
};

exports.updateEmployeeService = async (id, data = {}) => {
  const existing = await getEmployeeById(id);
  if (!existing) {
    throw { status: 404, message: "Employee not found" };
  }

  const fields = {};
  if (data.name !== undefined) fields.name = data.name;
  if (data.email !== undefined) fields.email = data.email;
  if (data.role !== undefined) fields.role = data.role;
  if (data.phone !== undefined) fields.phone = data.phone;
  if (data.project_id !== undefined) fields.project_id = data.project_id;
  if (data.priority !== undefined) fields.priority = data.priority;
  if (data.aadhar_path !== undefined) fields.aadhar_path = data.aadhar_path;
  if (data.pan_path !== undefined) fields.pan_path = data.pan_path;
  if (data.status !== undefined) fields.status = data.status;
  if (data.bank_account_name !== undefined) fields.bank_account_name = data.bank_account_name;
  if (data.bank_account_number !== undefined) fields.bank_account_number = data.bank_account_number;
  if (data.bank_ifsc !== undefined) fields.bank_ifsc = data.bank_ifsc;

  if (data.password) {
    fields.password = await bcrypt.hash(data.password, 10);
  }

  const updated = await updateEmployeeById(id, fields);
  if (!updated) {
    throw { status: 400, message: "No changes applied" };
  }

  return await getEmployeeById(id);
};

module.exports.forgotPasswordService = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw { status: 404, message: "User not found with this email" };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  await setUserOTP(email, otp, expiry);

  const subject = "Password Reset OTP - Ask Innovation";
  const text = `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`;
  const html = `<p>Your OTP for password reset is: <b>${otp}</b>. It is valid for 10 minutes.</p>`;

  await sendMail(email, subject, text, html);

  return { message: "OTP sent to your email" };
};

module.exports.verifyOTPService = async (email, otp) => {
  const user = await findUserByOTP(email, otp);
  if (!user) {
    throw { status: 400, message: "Invalid or expired OTP" };
  }
  return { message: "OTP verified successfully" };
};

module.exports.resetPasswordService = async (email, otp, newPassword) => {
  const user = await findUserByOTP(email, otp);
  if (!user) {
    throw { status: 400, message: "Invalid or expired OTP" };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await resetUserPassword(email, hashedPassword);

  return { message: "Password reset successfully" };
};
