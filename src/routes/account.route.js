const accountRoute = require("express").Router();
const Controller = require("../api/admin");
const { passwordRequired } = require("../middlewares/auth.middleware");

accountRoute.get('/shopper',  Controller.accountCtrl.getAccounts)
.get('/admins',   Controller.accountCtrl.getAdminAccounts)
.get('/business',   Controller.accountCtrl.getBusinessAccounts)
.get('/rider',   Controller.accountCtrl.getDriverAccounts)
.delete('/user',  Controller.accountCtrl.deleteAccount)
.delete('/admin',   Controller.accountCtrl.deleteAdminAccount)
.patch("/update", passwordRequired, Controller.accountCtrl.updateAccountStatus)

module.exports ={
  accountRoute
}