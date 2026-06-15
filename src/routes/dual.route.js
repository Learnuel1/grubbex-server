const express = require("express");
const Router = express.Router();
const Routes = require("./");
const { phoneIsRequired, webIsRequired } = require("../middlewares/auth.middleware");

Router.use("/", webIsRequired, Routes.Router); // require website user
// Router.use("/", webIsRequired, Routes.Router); // require website user
// Router.use("/m",  Routes.MobileRouter) // require mobile user
Router.use("/m", phoneIsRequired, Routes.MobileRouter) // require mobile user


module.exports = Router;