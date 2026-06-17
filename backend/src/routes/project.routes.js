const express = require("express");
const {
  helloController,
  createProjectController,
  getProjectsController,
  deleteProjectController,
  upsertProjectMasterController,
  getProjectMasterController,
} = require("../controllers/project.controller.js");
const { verifyToken } = require("../middlewares/auth.middleware.js");
const { allowRoles } = require("../middlewares/role.middleware.js");

const router = express.Router();

router.get("/health", async (req, res) => {
  const result = await helloController();
  res.status(result.status).json(result.body);
});

router.get(
  "/admin",
  verifyToken,
  allowRoles("admin"),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

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
 * tags:
 *   name: Project
 *   description: Project Management APIs
 */

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


// GET PROJECTS (Role-based)
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get projects (Admin → all, User → assigned only)
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
router.delete("/:id", verifyToken, allowRoles("admin"), deleteProjectController);
router.post("/master", verifyToken, allowRoles("employee", "developer", "admin"), upsertProjectMasterController);
router.get("/master", verifyToken, allowRoles("employee", "developer", "admin"), getProjectMasterController);

module.exports = router;
