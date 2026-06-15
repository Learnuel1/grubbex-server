const { default: mongoose, connect } = require("mongoose");
const logger = require("../../logger");
const config = require("../env");  

 
exports.MongoDB = async () => {
  try {
    // mongoose.set("strictQuery", true);
    logger.info("Connecting to Database...", { service: "database" });
    await connect(config.DB_URI);
    logger.info("Database Connected Successfully", { service: "database" });
  } catch (e) {
    logger.error(e);
    process.exit(-1);
  }
};


