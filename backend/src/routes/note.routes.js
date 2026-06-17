const express = require("express");
const {
  createNoteController,
  getNotesController,
  updateNoteController,
  deleteNoteController,
} = require("../controllers/note.controller.js");

const router = express.Router();

// POST /api/notes
router.post("/", createNoteController);

// GET /api/notes
router.get("/", getNotesController);

// PATCH /api/notes/:id
router.patch("/:id", updateNoteController);

// DELETE /api/notes/:id
router.delete("/:id", deleteNoteController);

module.exports = router;
