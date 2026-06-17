const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/response.util.js");
const pool = require("../config/db.config.js");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports.verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header)
    return res
      .status(401)
      .json(errorResponse("Token required"));

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Check user status in database to immediately logout inactive users
    const [rows] = await pool.execute(
      "SELECT status FROM users WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0 || rows[0].status === "inactive") {
      return res
        .status(401)
        .json(errorResponse("Your account is inactive or deleted"));
    }

    next();
  } catch {
    return res
      .status(401)
      .json(errorResponse("Invalid token"));
  }
};
