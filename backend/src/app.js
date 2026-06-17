// const express = require("express");
// const path = require("path");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const logger = require("./config/logger.config.js");
// const requestLogger = require("./middlewares/requestLogger.middleware.js");
// const authRoutes = require("./routes/auth.routes.js");
// const projectRoutes = require("./routes/project.routes.js");
// const taskRoutes = require("./routes/task.routes.js")
// const comment = require("./routes/comment.routes.js")
// const noteRoutes = require("./routes/note.routes.js");
// const { verifyToken } = require("./middlewares/auth.middleware.js");

// const swaggerUi = require("swagger-ui-express");
// const swaggerSpec = require("./config/swagger.config.js"); // import swagger-jsdoc config

// const basicAuth = require("express-basic-auth");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// app.use((req, res, next) => {
//   res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
//   res.set("Pragma", "no-cache");
//   res.set("Expires", "0");
//   res.set("Surrogate-Control", "no-store");
//   next();
// });

// app.use(requestLogger);

// app.use(
//   "/docs",
//   basicAuth({
//     users: { 
//       [process.env.SWAGGER_USER || "admin"]: process.env.SWAGGER_PASS || "supersecret123"
//     },
//     challenge: true,
//   }),
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec)
// );

// app.use("/api/auth", authRoutes);

// app.use("/api/projects", verifyToken, projectRoutes);
// app.use("/api/tasks", taskRoutes);
// app.use("/api/comments",comment);
// app.use("/api/notes", verifyToken, noteRoutes);
// app.get("/", (req, res) => {
//   logger.info({
//     apiId: "ROOT",
//     action: "Base route accessed",
//     requestId: req.requestId,
//     sessionId: req.sessionId,
//     message: "Welcome route hit",
//   });

//   res.json({
//     message: "Welcome to Ask Innovation Backend",
//     status: "Running",
//   });
// });

// // Serve frontend static files
// // NOTE: Adjust the path below if your dist folder is located elsewhere on cPanel
// app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// // Catch-all route to serve React's index.html for unknown routes (fixes "Cannot GET /route" on refresh)
// app.use((req, res, next) => {
//   // Only serve index.html for GET requests that don't target the API
//   if (req.method === "GET" && !req.path.startsWith("/api")) {
//     res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
//   } else {
//     next();
//   }
// });

// app.use((err, req, res, next) => {
//   logger.error({
//     apiId: "GLOBAL_ERROR",
//     action: "Unhandled exception",
//     requestId: req.requestId,
//     sessionId: req.sessionId,
//     error: err.message,
//     stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
//   });

//   res.status(500).json({
//     success: false,
//     message: "Internal Server Error",
//     error: process.env.NODE_ENV === "development" ? err.message : undefined,
//   });
// });

// app.listen(PORT, () => {
//   logger.info({
//     apiId: "SERVER_START",
//     action: "Server startup",
//     message: `Server is running on port ${PORT}`,
//   });
// });

// module.exports = app;





const express = require("express");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const logger = require("./config/logger.config.js");
const requestLogger = require("./middlewares/requestLogger.middleware.js");
const authRoutes = require("./routes/auth.routes.js");
const projectRoutes = require("./routes/project.routes.js");
const taskRoutes = require("./routes/task.routes.js")
const comment = require("./routes/comment.routes.js")
const noteRoutes = require("./routes/note.routes.js");
const { verifyToken } = require("./middlewares/auth.middleware.js");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger.config.js");
const basicAuth = require("express-basic-auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

app.use(requestLogger);

app.use(
  "/docs",
  basicAuth({
    users: {
      [process.env.SWAGGER_USER || "admin"]: process.env.SWAGGER_PASS || "supersecret123"
    },
    challenge: true,
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.use("/api/auth", authRoutes);
app.use("/api/projects", verifyToken, projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", comment);
app.use("/api/notes", verifyToken, noteRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../../dist")));

// Catch-all route
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../../index.html"));
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  logger.error({
    apiId: "GLOBAL_ERROR",
    action: "Unhandled exception",
    requestId: req.requestId,
    sessionId: req.sessionId,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

app.listen(PORT, () => {
  logger.info({
    apiId: "SERVER_START",
    action: "Server startup",
    message: `Server is running on port ${PORT}`,
  });
});

module.exports = app;






