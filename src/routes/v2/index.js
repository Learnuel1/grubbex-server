const Router_v2 = require("express")();
const MobileRouter_v2 = require("express")()
const AuthModule = require("./auth.route");

Router_v2.use("/auth", AuthModule.authRoute); 

module.exports = {
    Router_v2,
    MobileRouter_v2
};
