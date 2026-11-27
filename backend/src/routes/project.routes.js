const express = require("express");
const {
  helloController,
  createProjectController,
  updateProjectController,
  getProjectsController,
  deleteProjectController,
  upsertProjectMasterController,
  getProjectMasterController,
} = require("../controllers/project.controller.js");
const { verifyToken } = require("../middlewares/auth.middleware.js");
const { allowRoles } = require("../middlewares/role.middleware.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Project
 *   description: Project Management APIs
 */

/**
 * @swagger
 * /api/projects/health:
 *   get:
 *     summary: Health check for project module
 *     tags: [Project]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/health", async (req, res) => {
  const result = await helloController();
  res.status(result.status).json(result.body);
});

/**
 * @swagger
 * /api/projects/admin:
 *   get:
 *     summary: Admin access test endpoint
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/admin",
  verifyToken,
  allowRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

/**
 * @swagger
 * /api/projects/developer:
 *   get:
 *     summary: Developer access test endpoint
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Developer access granted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  "/developer",
  verifyToken,
  allowRoles("developer", "admin"),
  (req, res) => {
    res.json({ message: "Developer access granted" });
  }
);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project (Admin only)
 *     tags: [Project]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: CRM System
 *               description:
 *                 type: string
 *                 example: Customer relationship management project
 *               status:
 *                 type: string
 *                 enum: [active, completed, on_hold]
 *                 example: active
 *               show_in_grid:
 *                 type: boolean
 *                 default: true
 *                 description: Show the project in the dashboard project grid
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (Admin only)
 *       500:
 *         description: Internal server error
 */
router.post("/", verifyToken, allowRoles("admin"), createProjectController);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get projects (admin gets all, other roles get assigned only)
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Projects fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, getProjectsController);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project details and dashboard visibility (Admin only)
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               show_in_grid:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Admin only
 *       404:
 *         description: Project not found
 */
router.put("/:id", verifyToken, allowRoles("admin"), updateProjectController);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, allowRoles("admin"), deleteProjectController);

/**
 * @swagger
 * /api/projects/master:
 *   post:
 *     summary: Create or update project master settings
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_id:
 *                 type: integer
 *                 example: 1
 *               value:
 *                 type: string
 *                 example: Active
 *     responses:
 *       200:
 *         description: Project master value saved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post("/master", verifyToken, allowRoles("employee", "developer", "manager", "admin"), upsertProjectMasterController);

/**
 * @swagger
 * /api/projects/master:
 *   get:
 *     summary: Get project master settings
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         required: false
 *         schema:
 *           type: integer
 *         description: Optional project ID filter
 *     responses:
 *       200:
 *         description: Project master value fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get("/master", verifyToken, allowRoles("employee", "developer", "manager", "admin"), getProjectMasterController);

module.exports = router;
