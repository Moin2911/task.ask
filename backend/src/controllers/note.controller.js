const logger = require("../config/logger.config.js");
const noteService = require("../services/note.service.js");

const mapError = (error) => {
  switch (error.message) {
    case "PROJECT_NAME_REQUIRED":
      return { status: 400, message: "Project name is required" };
    case "NOTE_REQUIRED":
      return { status: 400, message: "Note is required" };
    case "NOTE_UPDATE_REQUIRED":
      return { status: 400, message: "No fields provided for update" };
    case "NOTE_NOT_FOUND":
      return { status: 404, message: "Note not found" };
    default:
      return { status: 500, message: "Internal server error" };
  }
};

module.exports.createNoteController = async (req, res) => {
  const apiId = "CREATE_NOTE";

  try {
    const data = await noteService.addNote(req.body, req.user);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "create note",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Note created successfully",
      data,
    });
  } catch (error) {
    const { status, message } = mapError(error);

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "create note failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
      error: error.message,
    });

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

module.exports.getNotesController = async (req, res) => {
  const apiId = "GET_NOTES";

  try {
    const data = await noteService.fetchNotes();

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get notes",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const { status, message } = mapError(error);

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "get notes failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
      error: error.message,
    });

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

module.exports.updateNoteController = async (req, res) => {
  const apiId = "UPDATE_NOTE";

  try {
    const data = await noteService.updateNote(
      req.params.id,
      req.body,
      req.user
    );

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "update note",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data,
    });
  } catch (error) {
    const { status, message } = mapError(error);

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "update note failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
      error: error.message,
    });

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

module.exports.deleteNoteController = async (req, res) => {
  const apiId = "DELETE_NOTE";

  try {
    await noteService.removeNote(req.params.id);

    logger.info({
      timestamp: new Date().toISOString(),
      level: "info",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "delete note",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
    });

    return res.status(200).json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    const { status, message } = mapError(error);

    logger.error({
      timestamp: new Date().toISOString(),
      level: "error",
      service: "note-service",
      env: process.env.NODE_ENV,
      apiId,
      action: "delete note failed",
      requestId: req.requestId,
      sessionId: req.sessionId || null,
      userId: req.user?.id || null,
      error: error.message,
    });

    return res.status(status).json({
      success: false,
      message,
    });
  }
};
