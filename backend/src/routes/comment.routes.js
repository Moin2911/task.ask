const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/auth.middleware.js");
const { allowRoles } = require("../middlewares/role.middleware.js");
const {
    addCommentController,
    getCommentsController,
    getAllCommentsController
} = require("../controllers/comment.controller.js");

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Task comment management
 */

/**
 * @swagger
 * /api/comments/{taskId}:
 *   post:
 *     summary: Add a comment for a task
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: integer
 *           example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 example: Task completed successfully
 *     responses:
 *       201:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: integer
 *                       example: 5
 *                     userId:
 *                       type: integer
 *                       example: 2
 *                     comment:
 *                       type: string
 *                       example: Task completed successfully
 *       500:
 *         description: Server error
 */
router.post("/:taskId", verifyToken, addCommentController);

/**
 * @swagger
 * /api/comments/{taskId}:
 *   get:
 *     summary: Get comments for a task with total count
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: Task ID
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: Comments list with total count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalComments:
 *                       type: integer
 *                       example: 3
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           task_id:
 *                             type: integer
 *                             example: 5
 *                           user_id:
 *                             type: integer
 *                             example: 2
 *                           user_name:
 *                             type: string
 *                             example: Moin
 *                           comment:
 *                             type: string
 *                             example: Looks good
 *                           created_at:
 *                             type: string
 *                             example: 2026-02-27T10:00:00Z
 *                           updated_at:
 *                             type: string
 *                             example: 2026-02-27T10:05:00Z
 *       500:
 *         description: Server error
 */
router.get("/:taskId", verifyToken, getCommentsController);

/**
 * @swagger
 * /api/comments:
 *   get:
 *     summary: Admin gets all comments with overall count
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All comments across tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalComments:
 *                       type: integer
 *                       example: 25
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 10
 *                           task_id:
 *                             type: integer
 *                             example: 5
 *                           task_title:
 *                             type: string
 *                             example: Build API
 *                           user_id:
 *                             type: integer
 *                             example: 2
 *                           user_name:
 *                             type: string
 *                             example: Moin
 *                           comment:
 *                             type: string
 *                             example: Completed
 *                           created_at:
 *                             type: string
 *                             example: 2026-02-27T10:00:00Z
 *                           updated_at:
 *                             type: string
 *                             example: 2026-02-27T10:05:00Z
 *       403:
 *         description: Unauthorized access
 */
router.get("/", verifyToken, allowRoles("admin"), getAllCommentsController);

module.exports = router;
