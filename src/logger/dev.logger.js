const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors, json} = format;

const myFormat = printf(({ level, message, service, timestamp , stack}) => {
  return `${timestamp} [${level}] [${service || "response"}]  ${stack || message}`;
});
exports.devLogger = () => {
  return createLogger({
    level: "debug",
    format: combine(
      json(),
      format.colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      errors({ stack: true }),
      myFormat
    ),
    // meta: { service },
    transports: [new transports.Console()],
  });
};