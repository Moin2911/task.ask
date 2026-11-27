const express = require("express");
const {
  createNoteController,
  getNotesController,
  updateNoteController,
  deleteNoteController,
} = require("../controllers/note.controller.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Note management APIs
 */

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project_name
 *               - note
 *             properties:
 *               project_name:
 *                 type: string
 *                 example: CRM System
 *               note:
 *                 type: string
 *                 example: Follow up with client tomorrow
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post("/", createNoteController);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notes fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get("/", getNotesController);

/**
 * @swagger
 * /api/notes/{id}:
 *   patch:
 *     summary: Update a note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_name:
 *                 type: string
 *                 example: CRM System
 *               note:
 *                 type: string
 *                 example: Updated note text
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", updateNoteController);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *       404:
 *         description: Note not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteNoteController);

module.exports = router;
