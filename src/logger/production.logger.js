const { createLogger, format, transports } = require("winston");
const config = require("../config/env");
require("winston-mongodb");
const { combine, timestamp, errors, json, metadata } = format;

const cleanMongoUrl = (value) => {
  if (!value) return null;
  return String(value).trim().replace(/^"|"$/g, "");
};

exports.proLogger = () => {
  const dbUrl = config.ERROR_LOG_URL;
  const logger = createLogger({
    level: "info",
    exitOnError: false,
    format: combine(json(), timestamp(), errors({ stack: true }), metadata()),
    transports: [],
  });

  if (!dbUrl) {
    logger.add(new transports.Console());
    logger.error("ERROR_LOG_URL is not configured; falling back to console logging.");
    return logger;
  }

  try {
    logger.add(
      new transports.MongoDB({
        level: "error",
        collection: "grubex_error_log",
        db: dbUrl, 
      })
    );
    logger.add(
      new transports.MongoDB({
        level: "info",
        collection: "grubex_infor_log",
        db: dbUrl, 
      })
    );
    logger.add(
      new transports.MongoDB({
        level: "debug",
        collection: "grubex_exception_log",
        db: dbUrl,
      })
    );
  } catch (error) {
    logger.add(new transports.Console());
    logger.error("Failed to initialize MongoDB logger transport; falling back to console.", error);
  }

  logger.on("error", (err) => {
    console.error("Logger transport error:", err);
  });

  return logger;
};
