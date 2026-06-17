const {
  createNote,
  getAllNotes,
  getNoteById,
  updateNoteById,
  deleteNoteById,
} = require("../models/note.model.js");

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

const resolveProjectName = (payload = {}) => {
  return (
    payload.project_name ||
    payload.projectName ||
    payload.project ||
    ""
  );
};

const resolveNoteText = (payload = {}) => {
  return payload.note || payload.notes || "";
};

module.exports.addNote = async (payload, user) => {
  const projectName = normalizeText(resolveProjectName(payload));
  const note = normalizeText(resolveNoteText(payload));

  if (!projectName) throw new Error("PROJECT_NAME_REQUIRED");
  if (!note) throw new Error("NOTE_REQUIRED");

  return createNote({
    projectName,
    note,
    userId: user?.id,
  });
};

module.exports.fetchNotes = async () => {
  return getAllNotes();
};

module.exports.updateNote = async (id, payload, user) => {
  const hasProject =
    Object.prototype.hasOwnProperty.call(payload, "project_name") ||
    Object.prototype.hasOwnProperty.call(payload, "projectName") ||
    Object.prototype.hasOwnProperty.call(payload, "project");
  const hasNote =
    Object.prototype.hasOwnProperty.call(payload, "note") ||
    Object.prototype.hasOwnProperty.call(payload, "notes");

  if (!hasProject && !hasNote) throw new Error("NOTE_UPDATE_REQUIRED");

  const projectName = hasProject
    ? normalizeText(resolveProjectName(payload))
    : undefined;
  const note = hasNote
    ? normalizeText(resolveNoteText(payload))
    : undefined;

  if (hasProject && !projectName) throw new Error("PROJECT_NAME_REQUIRED");
  if (hasNote && !note) throw new Error("NOTE_REQUIRED");

  const affectedRows = await updateNoteById(id, {
    projectName,
    note,
    userId: user?.id,
  });

  if (!affectedRows) throw new Error("NOTE_NOT_FOUND");

  return getNoteById(id);
};

module.exports.removeNote = async (id) => {
  const affectedRows = await deleteNoteById(id);
  if (!affectedRows) throw new Error("NOTE_NOT_FOUND");
  return true;
};
