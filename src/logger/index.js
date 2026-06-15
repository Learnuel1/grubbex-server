const config = require("../config/env");
const { devLogger } = require("./dev.logger");
const { proLogger } = require("./production.logger");
let logger = null;
if (config.NODE_ENV === "dev") {
  logger = devLogger();
} else {
  logger = proLogger();
}

module.exports = logger;
 