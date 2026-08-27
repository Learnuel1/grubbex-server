  const mongoose = require('mongoose');
const AccountModel = require('../../models/account.model');
const OrderModel = require('../../models/order.models');
const { CONSTANTS } = require('../../config');
exports.platFormPerformance = async (userType) => {
    try{ 
    const now = new Date();

    // 1. Calculate Start/End dates for Current Month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // 2. Calculate Start/End dates for Last Month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 3. Optional filter if userType is provided
    const matchStage = {};
    if (userType) {
      matchStage.type = userType; // Adjust field name to match your schema
    } else {
        matchStage.type = { $ne: CONSTANTS.ACCOUNT_TYPE_OBJ.admin }
    }

    const [stats] = await AccountModel.aggregate([
      { $match: matchStage },
      {
        $facet: {
          currentMonth: [
            {
              $match: {
                createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
              }
            },
            { $count: "count" }
          ],
          lastMonth: [
            {
              $match: {
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    // Extract counts safely (defaults to 0 if no records found)
    const currentMonthCount = stats?.currentMonth[0]?.count || 0;
    const lastMonthCount = stats?.lastMonth[0]?.count || 0;

    return { 
      data: {
        currentMonthCount,
        lastMonthCount,
        // Useful metrics:
        difference: currentMonthCount - lastMonthCount,
        percentageChange: lastMonthCount > 0 
          ? (((currentMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(2) + '%'
          : 'N/A'
      }
    };
    } catch(error){
        return {error: error.message || "An error occurred while fetching reports"}
    }

}
 

exports.getSalesTrend = async (duration = 'weekly', startDate, endDate) => {
    try {
        const matchStage = { status: "completed" };

        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        }

        const trendData = await OrderModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        // Returns 1 for Sunday, 2 for Monday, ..., 7 for Saturday
                        dayOfWeek: { $dayOfWeek: { date: "$createdAt", timezone: "Africa/Lagos" } }
                    },
                    totalOrders: { $sum: 1 },
                    totalSales: { $sum: "$totalAmount" } // Adjust field name to your schema
                }
            },
            { $sort: { "_id.dayOfWeek": 1 } },
            {
                $project: {
                    _id: 0,
                    dayOfWeek: "$_id.dayOfWeek",
                    totalOrders: 1,
                    totalSales: 1
                }
            }
        ]);

        // Calculate overall totals for the top header (₦0.00 display)
        const grandTotals = trendData.reduce((acc, curr) => {
            acc.totalRevenue += curr.totalSales;
            acc.totalOrders += curr.totalOrders;
            return acc;
        }, { totalRevenue: 0, totalOrders: 0 });

        // Map day numbers to chart labels
        const dayMap = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" };
        const chartData = trendData.map(item => ({
            label: dayMap[item.dayOfWeek],
            totalOrders: item.totalOrders,
            totalSales: item.totalSales
        }));

        return { 
            summary: grandTotals,
            chartData
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch sales trend" };
    }
};

exports.getCategoryShare = async (startDate, endDate) => {
    try {
        const matchStage = { status: "completed" };

        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        }

        const categoryStats = await OrderModel.aggregate([
            { $match: matchStage },
            // Deconstruct the array of items in each order
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name", // Or "$items.category" if referencing an ObjectId
                    itemCount: { $sum: "$items.quantity" }
                }
            },
            {
                $group: {
                    _id: null,
                    totalItemsSold: { $sum: "$itemCount" },
                    categories: {
                        $push: {
                            categoryName: "$_id",
                            count: "$itemCount"
                        }
                    }
                }
            },
            { $unwind: "$categories" },
            {
                $project: {
                    _id: 0,
                    category: "$categories.name",
                    count: "$categories.count",
                    percentage: {
                        $round: [
                            {
                                $multiply: [
                                    { $divide: ["$categories.count", "$totalItemsSold"] },
                                    100
                                ]
                            },
                            0 // Round to 0 decimal places for clean UI matching (30%, 25%)
                        ]
                    }
                }
            },
            { $sort: { percentage: -1 } }
        ]);

        return { 
            data: categoryStats
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch category breakdown" };
    }
};
exports.getSalesTrendByCity = async (duration = 'monthly', startDate, endDate) => {
    try {
        const matchStage = { status: "completed" };

        // Determine date range automatically based on duration if custom dates aren't provided
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        } else {
            const now = new Date();
            let fromDate = new Date();

            switch (duration) {
                case 'daily':
                    fromDate.setHours(0, 0, 0, 0); // Start of today
                    break;
                case 'weekly':
                    fromDate.setDate(now.getDate() - 7); // Last 7 days
                    break;
                case 'monthly':
                default:
                    fromDate.setMonth(now.getMonth() - 1); // Last 30 days / 1 month
                    break;
            }
            matchStage.createdAt = { $gte: fromDate, $lte: now };
        }

        const stats = await OrderModel.aggregate([
            { $match: matchStage },
            {
                $facet: {
                    totalMetrics: [
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$totalAmount" },
                                totalOrders: { $sum: 1 }
                            }
                        }
                    ],
                    cityBreakdown: [
                        {
                            $group: {
                                _id: "$deliveryAddress.city", // Adjust field path to match your schema
                                totalOrders: { $sum: 1 },
                                totalSales: { $sum: "$totalAmount" }
                            }
                        },
                        { $sort: { totalOrders: -1 } },
                        {
                            $project: {
                                _id: 0,
                                city: "$_id",
                                orders: "$totalOrders",
                                sales: "$totalSales"
                            }
                        }
                    ]
                }
            }
        ]);

        const summary = stats[0].totalMetrics[0] || { totalRevenue: 0, totalOrders: 0 };
        const citiesData = stats[0].cityBreakdown;

        return { 
            duration,
            summary,
            citiesData
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch sales trend by city" };
    }
};
exports.getTopSellingProducts = async (duration = 'monthly', limit = 5, startDate, endDate) => {
    try {
        const matchStage = { status: "completed" };

        // Determine date range automatically based on duration if custom dates aren't provided
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        } else {
            const now = new Date();
            let fromDate = new Date();

            switch (duration) {
                case 'daily':
                    fromDate.setHours(0, 0, 0, 0); // Start of today
                    break;
                case 'weekly':
                    fromDate.setDate(now.getDate() - 7); // Last 7 days
                    break;
                case 'monthly':
                default:
                    fromDate.setMonth(now.getMonth() - 1); // Last 30 days / 1 month
                    break;
            }
            matchStage.createdAt = { $gte: fromDate, $lte: now };
        }

        const topProducts = await OrderModel.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    image: { $first: "$items.image" },
                    description: { $first: "$items.description" },
                    price: { $first: "$items.price" },
                    totalQuantitySold: { $sum: "$items.quantity" },
                    totalRevenueGenerated: {
                        $sum: { $multiply: ["$items.quantity", "$items.price"] }
                    }
                }
            },
            { $sort: { totalQuantitySold: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    name: 1,
                    image: 1,
                    description: 1,
                    price: 1,
                    totalQuantitySold: 1,
                    formattedQuantity: { $concat: [{ $toString: "$totalQuantitySold" }, " pcs"] },
                    totalRevenueGenerated: 1
                }
            }
        ]);

        return { 
            duration,
            data: topProducts
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch top selling products" };
    }
};