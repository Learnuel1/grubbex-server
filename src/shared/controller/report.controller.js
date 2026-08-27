const { CONSTANTS } = require("../../config");
const logger = require("../../logger");
const { platFormPerformance, getSalesTrend, getCategoryShare,getSalesTrendByCity, getTopSellingProducts } = require("../services/interface");
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
        const { userType } = req.query; // Optional query parameter to filter by user type
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
        const salesTrend = await getSalesTrend(duration, startDate, endDate);
        if(salesTrend?.error) return next(APIError.badRequest(salesTrend.error));
        logger.info("Sales trend report fetched successfully", {service: META.REPORT});
        const saleCategoryShare = await getCategoryShare(duration, startDate, endDate);
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