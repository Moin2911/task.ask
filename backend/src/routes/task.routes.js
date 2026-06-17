const express = require("express");
const {
  createTaskController,
  getTasksController,
  getMyTasksController,
  deleteTaskController,
  updateTaskStatusController,
  getKanbanPendingTasksController,
  getKanbanInProgressTasksController,
  getKanbanCompletedTasksController,
  getTaskHistoryController
} = require("../controllers/task.controller.js");
const { verifyToken } = require("../middlewares/auth.middleware");
const { allowRoles } = require("../middlewares/role.middleware");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management APIs
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - project_id
 *               - assigned_to
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               assigned_to:
 *                 type: integer
 *               priority:
 *                 type: string
 *                 example: high
 *               status:
 *                 type: string
 *                 example: pending
 *     responses:
 *       201:
 *         description: Task created
 */

// ADD TASK
router.post("/", createTaskController);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         description: Search by task title or description
 *         schema:
 *           type: string
 *           example: landing
 *     responses:
 *       200:
 *         description: List of tasks
 */

// GET TASKS
router.get("/", getTasksController);


/**
 * @swagger
 * /api/tasks/my-tasks:
 *   get:
 *     summary: Get tasks assigned to logged-in user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         description: Search by task title or description
 *         schema:
 *           type: string
 *           example: icon
 *     responses:
 *       200:
 *         description: List of tasks assigned to the current user
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   title: Fix login bug
 *                   description: JWT token issue
 *                   project_id: 2
 *                   project_name: CRM System
 *                   assigned_to: 5
 *                   assigned_user: Moin Khan
 *                   priority: high
 *                   status: pending
 *                   created_at: 2026-02-21T10:00:00.000Z
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID to delete
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Forbidden (Not allowed to delete this task)
 *       404:
 *         description: Task not found
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", verifyToken, deleteTaskController);

/**
 * @swagger
 * /api/tasks/my-tasks:
 *   get:
 *     summary: Get tasks assigned to the current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks assigned to the current user
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   title: Fix login bug
 *                   description: JWT token issue
 *                   project_id: 2
 *                   project_name: CRM System
 *                   assigned_to: 5
 *                   assigned_user: Moin Khan
 *                   priority: high
 *                   status: pending
 *                   created_at: 2026-02-21T10:00:00.000Z
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (Role not allowed)
 *       500:
 *         description: Internal server error
 */
router.get(
  "/my-tasks",
  verifyToken,
  allowRoles("developer", "admin"),
  getMyTasksController
);

/**
 * @swagger
 * /api/tasks/kanban/pending:
 *   get:
 *     summary: Get pending tasks for Kanban (paginated)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *           example: poly stocks
 *       - in: query
 *         name: employee
 *         schema:
 *           type: string
 *           example: Moin
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: landing
 *     responses:
 *       200:
 *         description: Pending tasks with total count and pagination
 */
router.get(
  "/kanban/pending",
  verifyToken,
  allowRoles("developer", "admin"),
  getKanbanPendingTasksController
);

/**
 * @swagger
 * /api/tasks/kanban/in-progress:
 *   get:
 *     summary: Get in-progress tasks for Kanban (paginated)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *       - in: query
 *         name: employee
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: In-progress tasks with total count and pagination
 */
router.get(
  "/kanban/in-progress",
  verifyToken,
  allowRoles("developer", "admin"),
  getKanbanInProgressTasksController
);

/**
 * @swagger
 * /api/tasks/kanban/completed:
 *   get:
 *     summary: Get completed tasks for Kanban (paginated)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *       - in: query
 *         name: employee
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Completed tasks with total count and pagination
 */
router.get(
  "/kanban/completed",
  verifyToken,
  allowRoles("developer", "admin"),
  getKanbanCompletedTasksController
);




/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     description: Admin can update any task. Developer can update only assigned task.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: integer
 *           example: 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed]
 *                 example: completed
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Task status updated successfully
 *       403:
 *         description: Forbidden — not allowed to update task
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: You are not allowed to update this task
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Task not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Internal server error
 */

router.patch("/:id/status", verifyToken,updateTaskStatusController);

router.get("/history", verifyToken, getTaskHistoryController);




module.exports = router;
