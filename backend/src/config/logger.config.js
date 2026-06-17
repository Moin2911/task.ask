const winston = require("winston");

const IST = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: false
  });

//Toggle file logging here 
const enableFileLogging = true;

const transports = [
  new winston.transports.Console()
];

if (enableFileLogging) {
  transports.push(
    new winston.transports.File({
      filename: "logs/app.log"
    })
  );
}

const logger = winston.createLogger({
  level: "info",
  defaultMeta: {
    service: "ask-innovation-backend",
    env: process.env.NODE_ENV || "dev"
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: IST }),
    winston.format.json()
  ),
  transports
});

module.exports = logger;
