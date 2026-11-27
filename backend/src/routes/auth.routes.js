const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  registerController,
  loginController,
  deleteEmployeeController,
  getEmployeesController,
  getEmployeeByIdController,
  updateEmployeeController,
  forgotPasswordController,
  verifyOTPController,
  resetPasswordController,
} = require("../controllers/auth.controller.js");
const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "uploads", "employees");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `employee-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({ storage });
const employeeFiles = upload.fields([
  { name: "aadhar_file", maxCount: 1 },
  { name: "pan_file", maxCount: 1 },
]);

/**
 * @swagger
 * tags:
 *   name: Employee
 *   description: Employee Management APIs
 */


/**
 * @swagger
 * /api/auth/employee:
 *   get:
 *     summary: Get all employees
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/employee", getEmployeesController);

/**
 * @swagger
 * /api/auth/employee/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.get("/employee/:id", getEmployeeByIdController);



/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Add/Register a new employee
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul
 *               email:
 *                 type: string
 *                 example: rahul@test.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               role:
 *                 type: string
 *                 enum: [admin, developer, employee, manager]
 *                 example: admin
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               project_id:
 *                 type: integer
 *                 example: 1
 *                 description: Assigned project ID (optional)
 *               project_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *                 description: Multiple assigned project IDs (optional)
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *     responses:
 *       201:
 *         description: Employee registered successfully
 *       400:
 *         description: Register failed (validation error)
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post("/register", employeeFiles, registerController);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: rahul@test.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", loginController);

/**
 * @swagger
 * /api/auth/employee/{id}:
 *   delete:
 *     summary: Delete an employee by ID
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID to delete
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.delete("/employee/:id", deleteEmployeeController);

/**
 * @swagger
 * /api/auth/employee/{id}:
 *   patch:
 *     summary: Update an employee by ID
 *     tags: [Employee]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul Kumar
 *               email:
 *                 type: string
 *                 example: rahul@test.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               role:
 *                 type: string
 *                 enum: [admin, developer, employee, manager]
 *                 example: developer
 *               project_id:
 *                 type: integer
 *                 example: 2
 *               project_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 4]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 example: medium
 *               aadhar_file:
 *                 type: string
 *                 format: binary
 *               pan_file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.patch("/employee/:id", employeeFiles, updateEmployeeController);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: rahul@test.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post("/forgot-password", forgotPasswordController);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: rahul@test.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       500:
 *         description: Internal server error
 */
router.post("/verify-otp", verifyOTPController);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: rahul@test.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: NewPass@123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.post("/reset-password", resetPasswordController);

module.exports = router;
