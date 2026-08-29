const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { platFormPerformance, getSalesTrend, getCategoryShare,getSalesTrendByCity, getTopSellingProducts, getDashboardOverviewStats, getDashboardOverviewStatsAdmin, getUserKYCByAccountId, getRecentTransactions } = require("../services/interface");
const { META } = require("../utils/actions");
const { APIError } = require("../utils/apiError");

exports.getAllReports = async (req, res, next) => {
    try {
        const data = [];
        if(req.userType == CONSTANTS.ACCOUNT_TYPE_OBJ.admin) {

            const platformPerformance = await platFormPerformance();
            if(platformPerformance?.error) return next(APIError.badRequest(platformPerformance.error));
            data.push({platformPerformance});
            logger.info("Platform performance report fetched successfully", {service: META.REPORT});
            
        } 
        const orderAnalytics = await  getOrderAnalytics();
        if(orderAnalytics?.error) return next(APIError.badRequest(orderAnalytics.error));
        logger.info("Order analytics report fetched successfully", {service: META.REPORT});
        data.push({orders:orderAnalytics});

        return res.status(200).json({
            success: true,
            message: data.length === 0 ? "No reports found" : "Reports fetched successfully",
            reports: data
        });
    } catch (error) {
        next(error);
    }
}
exports.getPlatformPerformanceReport = async (req, res, next) => {
    try {
      
        const shopper = await platFormPerformance(CONSTANTS.ACCOUNT_TYPE_OBJ.shopper);
        if(shopper?.error) return next(APIError.badRequest(shopper.error));
        logger.info("Platform performance report fetched successfully", {service: META.REPORT});
        const riders = await platFormPerformance(CONSTANTS.ACCOUNT_TYPE_OBJ.rider);
        if(riders?.error) return next(APIError.badRequest(riders.error));
        logger.info("Platform performance report fetched successfully", {service: META.REPORT});
        const stores = await platFormPerformance(CONSTANTS.ACCOUNT_TYPE_OBJ.business);
        if(stores?.error) return next(APIError.badRequest(stores.error));
        logger.info("Platform performance report fetched successfully", {service: META.REPORT});
        const report = { shopper: shopper.data, riders: riders.data, stores: stores.data };
        return res.status(200).json({
            success: true,
            message: "Platform performance report fetched successfully",
            report
        });
    } catch (error) {
        next(error);
    }
}
exports.getSalesTrendReport = async (req, res, next) => {
    try {
        const { duration, startDate, endDate } = req.query; // Optional query parameters for filtering
        if(duration && !Array.from(Object.values(CONSTANTS.REPORT_DURATION_OBJ)).includes(duration)) {
            return next(APIError.badRequest("Invalid duration specified"));
        }
        let salesTrend ;
        if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business) {
            salesTrend = await getSalesTrend(duration,  startDate, endDate,req.user,);
        } else {
            salesTrend = await getSalesTrend(duration, startDate, endDate);
        }
        if(salesTrend?.error) return next(APIError.badRequest(salesTrend.error));
        logger.info("Sales trend report fetched successfully", {service: META.REPORT});
        let  saleCategoryShare ;
        if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business) {
            saleCategoryShare = await getCategoryShare(duration, startDate, endDate, req.user);
        } else {
            saleCategoryShare = await getCategoryShare(duration, startDate, endDate);
        }
        if(saleCategoryShare?.error) return next(APIError.badRequest(saleCategoryShare.error));
        logger.info("Sales category share report fetched successfully", {service: META.REPORT});
        const report = { salesTrend: salesTrend, categoryShare: saleCategoryShare.data };
        return res.status(200).json({
            success: true,
            message: "Sales trend report fetched successfully",
            report: report
        });
    } catch (error) {
        next(error);
    }   
}
exports.getSalesTrendByCityReport = async (req, res, next) => {
    try {
        const { duration, startDate, endDate } = req.query; // Optional query parameters for filtering
         if(duration && !Array.from(Object.values(CONSTANTS.REPORT_DURATION_OBJ)).includes(duration)) {
            return next(APIError.badRequest("Invalid duration specified"));
        }
        const salesTrendByCity = await getSalesTrendByCity(duration, startDate, endDate);
        if(salesTrendByCity?.error) return next(APIError.badRequest(salesTrendByCity.error));
        logger.info("Sales trend by city report fetched successfully", {service: META.REPORT});
        return res.status(200).json({
            success: true,
            message: "Sales trend by city report fetched successfully",
            report: salesTrendByCity
        });
    } catch (error) {
        next(error);
    }   
}
exports.getTopSellingProductsReport = async (req, res, next) => {
    try {
        const { duration, startDate, endDate } = req.query;  
         if(duration && !Array.from(Object.values(CONSTANTS.REPORT_DURATION_OBJ)).includes(duration)) {
            return next(APIError.badRequest("Invalid duration specified"));
        }
        const topSellingProducts = await getTopSellingProducts(duration, startDate, endDate);
        if(topSellingProducts?.error) return next(APIError.badRequest(topSellingProducts.error));
        logger.info("Top selling products report fetched successfully", {service: META.REPORT});
        return res.status(200).json({
            success: true,
            message: "Top selling products report fetched successfully",
            report: topSellingProducts.data
        });
    } catch (error) {
        next(error);
    }   
}
exports.getDashboardOverviewStatsReport = async (req, res, next) => {
    try {
        let dashboardOverviewStats;
        if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.admin ) {
            dashboardOverviewStats = await getDashboardOverviewStatsAdmin();
        } else {
            const {store} = await getUserKYCByAccountId(req.userId);
           if(!store || store.length === 0) return next(APIError.badRequest("Store not found for the user"));
            dashboardOverviewStats = await getDashboardOverviewStats(store[0].storeId);
        }
        if(dashboardOverviewStats?.error) return next(APIError.badRequest(dashboardOverviewStats.error));
        logger.info("Dashboard overview stats report fetched successfully", {service: META.REPORT});
        return res.status(200).json({
            success: true,
            message: "Dashboard overview stats report fetched successfully",
            report: dashboardOverviewStats.data
        });
    } catch (error) {
        next(error);
    }
}
exports.getRecentTransactionInfo = async (req, res, next ) => {
    try{
          const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const query = {};
        if(req.userType === CONSTANTS.ACCOUNT_TYPE_OBJ.business) {
             const {store} = await getUserKYCByAccountId(req.userId);
           if(!store || store.length === 0) return next(APIError.badRequest("Store not found for the user"));
            query.storeId = store[0].storeId;
        }
        const  info = await getRecentTransactions(query, page, limit)
        if(info?.error) return next(APIError.badRequest(info.error));
         logger.info("Recent transactions fetched successfully", {service: META.REPORT});
         return res.status(200).json({
            success: true,
            message: "Recent Transaction fetched successfully",
             info
        });
    } catch (error) {
        next(error)
    }
}