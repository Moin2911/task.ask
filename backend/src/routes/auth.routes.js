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
 *                 enum: [admin, developer]
 *                 example: admin
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               project_id:
 *                 type: integer
 *                 example: 1
 *                 description: Assigned project ID (optional)
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
router.patch("/employee/:id", employeeFiles, updateEmployeeController);

router.post("/forgot-password", forgotPasswordController);
router.post("/verify-otp", verifyOTPController);
router.post("/reset-password", resetPasswordController);

module.exports = router;
