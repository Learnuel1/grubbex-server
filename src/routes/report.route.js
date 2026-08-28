const AdminsReportRouter = require('express').Router();
const { userRequired, adminRequired } = require("../middlewares/auth.middleware");
const { allowedRoles } = require("../shared/middleware/data_validator.middleware");
const { CONSTANTS } = require("../config");
const shared = require("../shared");
const { validateRequestData } = require("../shared/middleware/data_validator.middleware");
const ReportsRouter = require("express").Router();
const StoreReportRouter = require("express").Router();

AdminsReportRouter.get("/all",  shared.Controllers.ReportController.getAllReports)
.get("/platform-performance",  shared.Controllers.ReportController.getPlatformPerformanceReport)
.get("/sales-trend",  shared.Controllers.ReportController.getSalesTrendReport).get("/sales-city-trend", shared.Controllers.ReportController.getSalesTrendByCityReport).get("/top-selling-products", shared.Controllers.ReportController.getTopSellingProductsReport).get("/dashboard-overview", shared.Controllers.ReportController.getDashboardOverviewStatsReport)

StoreReportRouter.get("/sales-trend",  shared.Controllers.ReportController.getSalesTrendReport).get("/sales-city-trend", shared.Controllers.ReportController.getSalesTrendByCityReport).get("/top-selling-products", shared.Controllers.ReportController.getTopSellingProductsReport).get("/dashboard-overview", shared.Controllers.ReportController.getDashboardOverviewStatsReport)
ReportsRouter.use("/admin", adminRequired, AdminsReportRouter).use("/store", userRequired, allowedRoles([CONSTANTS.ACCOUNT_ROLE_OBJ.business]), StoreReportRouter);

module.exports = {
    ReportsRouter
}
