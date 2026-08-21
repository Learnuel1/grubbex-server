const appServer = require("./src/app")
const { dbConnect } = require("./src/config/db.config.js");
const appLogger = require("./src/logger/index.js");
const { errorMiddleWareModule } = require("./src/middlewares/index.js"); 
const config = require("./src/config/env.js");
const Routers = require("./src/routes/dual.route.js"); 
const server = require("http").createServer(appServer);
const { engine } = require ('express-handlebars'); 
const { connections } = require("./src/shared/utils/socket.js");
const { defaultAdminAccount } = require("./src/api/admin/controller/admin_account.controller.js");
const { sendEMail } = require("./src/utils/mailer.js");
const expressWinston = require('express-winston');
const Notification = require("./src/shared/utils/Notification.js");
const loadSecrets = require("./secret.loader.js");
const io = require("socket.io")(server);

appServer.engine('.handlebars', engine({extname: '.handlebars'}));
appServer.set('view engine', '.handlebars');
appServer.set('views', '../src/views');

appServer.use("/api/v1", Routers); 
 
io.on("connection", (socket) => { 
  logger.info("Socket io connected successfully", {service: "socket io"});
  socket.on("disconnect", (socket) => {
    const user = connections.find(x => x.activeId !== socket.id);
    connections.splice(connections.indexOf(user), 1);
    logger.info("Socket io disconnected successfully", {service: "socket io"});
  
  });
});
const startServer = async () => {
  try{
  //  await loadSecrets("grubbex-secrete-key");
  const PORT = config.SERVER_PORT || 4000;
  appServer.all("*", errorMiddleWareModule.notFound);
  appServer.use(errorMiddleWareModule.errorHandler);
  appServer.use(expressWinston.logger(appLogger));
    server.listen(PORT, async () => {
  try {
    await dbConnect.MongoDB();
    await defaultAdminAccount();
    const notice = new Notification(); 
    appLogger.info(`server running on port ${PORT}`, {service:"application"});
    notice.emit("systemLoaded");
  } catch (error) {
    appLogger.error(error, {service:"application"});
    process.exit(-1);
  }
});
  } catch (error){
     appLogger.error(error, {service:"application"});
    process.exit(-1);
  }
}

startServer();
