const { userRequired, checkRouteUsed } = require("../middlewares/auth.middleware");

const ReturnedOrderRouter = require("express")();
const routes = require("express")();

ReturnedOrderRouter.use("/", userRequired, checkRouteUsed, routes);
module.exports = { 
    ReturnedOrderRouter,
}