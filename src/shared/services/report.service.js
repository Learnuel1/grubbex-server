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
 

exports.getSalesTrend = async (duration = 'weekly', startDate, endDate, user) => {
    try {
        const matchStage = { status: "completed" };
        if(user) {
            matchStage.store = user;
        }
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

exports.getCategoryShare = async (startDate, endDate, user) => {
    try {
        const matchStage = { status: "completed" };
        if(user) {
            matchStage.store = user;
        }
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
exports.getSalesTrendByCity = async (duration = 'monthly', startDate, endDate, user) => {
    try {
        const matchStage = { status: "completed" };
        if(user) {
            matchStage.store = user;
        }
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
exports.getTopSellingProducts = async (duration = 'monthly', limit = 5, startDate, endDate, user) => {
    try {
        const matchStage = { status: "completed" };
        if(user) {
            matchStage.store = user;
        }
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

exports.getPeakOrderTimes = async (duration = 'weekly', startDate, endDate) => {
    try {
        const matchStage = { status: "completed", type: CONSTANTS.ORDER_TYPE_OBJ.delivery }; // Only consider delivery orders for peak times

        // Determine date range filter based on duration if custom dates aren't provided
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = new Date(startDate);
            if (endDate) matchStage.createdAt.$lte = new Date(endDate);
        } else {
            const now = new Date();
            let fromDate = new Date();

            switch (duration) {
                case 'daily':
                    fromDate.setHours(0, 0, 0, 0); // Today starting at 00:00
                    break;
                case 'weekly':
                    fromDate.setDate(now.getDate() - 7); // Last 7 days
                    break;
                case 'monthly':
                default:
                    fromDate.setMonth(now.getMonth() - 1); // Last 30 days
                    break;
            }
            matchStage.createdAt = { $gte: fromDate, $lte: now };
        }
        
        const peakOrderData = await OrderModel.aggregate([
            { $match: matchStage },
            {
                $project: {
                    totalAmount: 1,
                    // Extract Day of Week in local time (1 = Sun, 2 = Mon, ..., 7 = Sat)
                    dayOfWeek: { $dayOfWeek: { date: "$createdAt", timezone: "Africa/Lagos" } },
                    // Extract Hour in 24-hour format (0 to 23) in local time
                    hour: { $hour: { date: "$createdAt", timezone: "Africa/Lagos" } }
                }
            },
            {
                $project: {
                    dayOfWeek: 1,
                    totalAmount: 1,
                    // Bucket hours into matching chart time slots
                    timeSlot: {
                        $switch: {
                            branches: [
                                {
                                    case: { $and: [{ $gte: ["$hour", 6] }, { $lt: ["$hour", 9] }] },
                                    then: "06:00 AM - 08:00 AM"
                                },
                                {
                                    case: { $and: [{ $gte: ["$hour", 9] }, { $lt: ["$hour", 12] }] },
                                    then: "09:00 AM - 11:00 AM"
                                },
                                {
                                    case: { $and: [{ $gte: ["$hour", 12] }, { $lt: ["$hour", 15] }] },
                                    then: "12:00 PM - 02:00 PM"
                                },
                                {
                                    case: { $and: [{ $gte: ["$hour", 15] }, { $lt: ["$hour", 18] }] },
                                    then: "03:00 PM - 05:00 PM"
                                },
                                {
                                    case: { $and: [{ $gte: ["$hour", 18] }, { $lt: ["$hour", 21] }] },
                                    then: "06:00 PM - 08:00 PM"
                                }
                            ],
                            default: "Other"
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        dayOfWeek: "$dayOfWeek",
                        timeSlot: "$timeSlot"
                    },
                    count: { $sum: 1 },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id.dayOfWeek": 1 } },
            {
                $group: {
                    _id: "$_id.dayOfWeek",
                    timeSlots: {
                        $push: {
                            slot: "$_id.timeSlot",
                            count: "$count"
                        }
                    },
                    totalDayOrders: { $sum: "$count" },
                    totalDayRevenue: { $sum: "$totalSales" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Days mapping (MongoDB 1 = Sun, 2 = Mon ... 7 = Sat)
        const dayMap = { 1: "Sun", 2: "Mon", 3: "Tue", 4: "Wed", 5: "Thu", 6: "Fri", 7: "Sat" };

        let totalRevenue = 0;
        let totalOrders = 0;

        const formattedChartData = peakOrderData.map(item => {
            totalRevenue += item.totalDayRevenue;
            totalOrders += item.totalDayOrders;

            // Transform timeSlots array into a clean object key-value pair for stacked charts
            const slotsObj = {};
            item.timeSlots.forEach(s => {
                slotsObj[s.slot] = s.count;
            });

            return {
                day: dayMap[item._id],
                totalDayOrders: item.totalDayOrders,
                ...slotsObj
            };
        });

        return {
            success: true,
            summary: {
                totalRevenue,
                totalOrders
            },
            data: formattedChartData
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch peak order times" };
    }
};
const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    const change = ((current - previous) / previous) * 100;
    return Math.round(change); // Returns whole number (e.g. 40 for +40%, -20 for -20%)
};

exports.getDashboardOverviewStatsAdmin = async () => {
    try {
        const now = new Date();

        // 1. Date Range Definitions (Africa/Lagos WAT boundaries)
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // -------------------------------------------------------------
        // QUERY 1: User Metrics (Stores & Delivery Drivers Count)
        // -------------------------------------------------------------
        const [userStats] = await AccountModel.aggregate([
            {
                $match: {
                    type: { $in: [CONSTANTS.ACCOUNT_TYPE_OBJ.vendor, CONSTANTS.ACCOUNT_TYPE_OBJ.rider] } // Adjust userType values as per your schema
                }
            },
            {
                $facet: {
                    // Stores (Vendors)
                    currentStores: [
                        { $match: { type: CONSTANTS.ACCOUNT_TYPE_OBJ.vendor, createdAt: { $gte: startOfCurrentMonth, $lte: now } } },
                        { $count: "count" }
                    ],
                    lastStores: [
                        { $match: { type: CONSTANTS.ACCOUNT_TYPE_OBJ.vendor, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                        { $count: "count" }
                    ],
                    // Delivery Drivers
                    currentDrivers: [
                        { $match: { type: CONSTANTS.ACCOUNT_TYPE_OBJ.rider, createdAt: { $gte: startOfCurrentMonth, $lte: now } } },
                        { $count: "count" }
                    ],
                    lastDrivers: [
                        { $match: { type: CONSTANTS.ACCOUNT_TYPE_OBJ.rider, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        // -------------------------------------------------------------
        // QUERY 2: Order Metrics (Orders Processed & Gross Value)
        // -------------------------------------------------------------
        const [orderStats] = await OrderModel.aggregate([
            {
                $match: {
                    status: CONSTANTS.ORDER_STATUS_OBJ.completed, // Only consider completed orders for metrics
                    orderType: CONSTANTS.ORDER_TYPE_OBJ.delivery, // Only consider delivery orders for metrics
                }
            },
            {
                $facet: {
                    currentMonthOrders: [
                        { $match: { createdAt: { $gte: startOfCurrentMonth, $lte: now } } },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                                grossValue: { $sum: "$totalAmount" }
                            }
                        }
                    ],
                    lastMonthOrders: [
                        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                        {
                            $group: {
                                _id: null,
                                count: { $sum: 1 },
                                grossValue: { $sum: "$totalAmount" }
                            }
                        }
                    ]
                }
            }
        ]);

        // -------------------------------------------------------------
        // Extracting Counts & Values
        // -------------------------------------------------------------
        const currentStoresCount = userStats.currentStores[0]?.count || 0;
        const lastStoresCount = userStats.lastStores[0]?.count || 0;

        const currentDriversCount = userStats.currentDrivers[0]?.count || 0;
        const lastDriversCount = userStats.lastDrivers[0]?.count || 0;

        const currentOrdersCount = orderStats.currentMonthOrders[0]?.count || 0;
        const lastOrdersCount = orderStats.lastMonthOrders[0]?.count || 0;

        const currentGrossValue = orderStats.currentMonthOrders[0]?.grossValue || 0;
        const lastGrossValue = orderStats.lastMonthOrders[0]?.grossValue || 0;

        // -------------------------------------------------------------
        // Structure Final Output Object
        // -------------------------------------------------------------
        return { 
            data: {
                totalStores: {
                    value: currentStoresCount,
                    percentageChange: calculatePercentageChange(currentStoresCount, lastStoresCount)
                },
                totalDeliveryDrivers: {
                    value: currentDriversCount,
                    percentageChange: calculatePercentageChange(currentDriversCount, lastDriversCount)
                },
                ordersProcessed: {
                    value: currentOrdersCount,
                    percentageChange: calculatePercentageChange(currentOrdersCount, lastOrdersCount)
                },
                grossValue: {
                    value: currentGrossValue,
                    percentageChange: calculatePercentageChange(currentGrossValue, lastGrossValue)
                }
            }
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch dashboard overview metrics" };
    }
};

exports.getDashboardOverviewStats = async (user) => {
    try {
         const now = new Date();   
        // 1. Month range boundaries (Africa/Lagos WAT)
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        // 2. Single Aggregation Pipeline on OrderModel
        const [stats] = await OrderModel.aggregate([
            {
                $match: {
                    status: CONSTANTS.ORDER_STATUS_OBJ.delivered,
                    orderType: CONSTANTS.ORDER_STATUS_OBJ.delivery,
                    storeId: user,
                    createdAt: { $gte: startOfLastMonth, $lte: now }
                }
            },
            {
                $facet: {
                    // Current Month Aggregations
                    currentMonth: [
                        { $match: { createdAt: { $gte: startOfCurrentMonth, $lte: now } } },
                        {
                            $group: {
                                _id: null,
                                activeStores: { $addToSet: "$storeId" },     // Unique stores with completed orders
                                activeDrivers: { $addToSet: "$riderId" },   // Unique drivers with completed orders (adjust field name if riderId)
                                totalOrders: { $sum: 1 },
                                grossValue: { $sum: "$totalAmount" }
                            }
                        }
                    ],
                    // Last Month Aggregations
                    lastMonth: [
                        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                        {
                            $group: {
                                _id: null,
                                activeStores: { $addToSet: "$storeId" },
                                activeDrivers: { $addToSet: "$riderId" },
                                totalOrders: { $sum: 1 },
                                grossValue: { $sum: "$totalAmount" }
                            }
                        }
                    ]
                }
            }
        ]);

        // 3. Extract & count array lengths for unique entities
        const currentData = stats.currentMonth[0] || {};
        const lastData = stats.lastMonth[0] || {};

        const currentStoresCount = currentData.activeStores ? currentData.activeStores.length : 0;
        const lastStoresCount = lastData.activeStores ? lastData.activeStores.length : 0;

        const currentDriversCount = currentData.activeDrivers ? currentData.activeDrivers.length : 0;
        const lastDriversCount = lastData.activeDrivers ? lastData.activeDrivers.length : 0;

        const currentOrdersCount = currentData.totalOrders || 0;
        const lastOrdersCount = lastData.totalOrders || 0;

        const currentGrossValue = currentData.grossValue || 0;
        const lastGrossValue = lastData.grossValue || 0;

        // 4. Return payload structured for the frontend cards
        return { 
            data: {
                totalStores: {
                    value: currentStoresCount,
                    percentageChange: calculatePercentageChange(currentStoresCount, lastStoresCount)
                },
                totalDeliveryDrivers: {
                    value: currentDriversCount,
                    percentageChange: calculatePercentageChange(currentDriversCount, lastDriversCount)
                },
                ordersProcessed: {
                    value: currentOrdersCount,
                    percentageChange: calculatePercentageChange(currentOrdersCount, lastOrdersCount)
                },
                grossValue: {
                    value: currentGrossValue,
                    percentageChange: calculatePercentageChange(currentGrossValue, lastGrossValue)
                }
            }
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch dashboard overview metrics" };
    }
};
exports.getRecentTransactions = async ( query, page = 1, limit = 10) => {
    try {
        const skip = (page - 1) * limit;

        const orders = await OrderModel.find(query)
            .populate("shopper", "email")
            .populate("store", "name logo")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const totalRecords = await OrderModel.countDocuments(query);
        const data = orders.map(order => {
            const rawCategories = order.items ? order.items.map(item => item.category) : [];
            const uniqueCategories = [...new Set(rawCategories)];

            return {
                orderId: order.orderId,
                storeName: order.store?.name ,
                storeLogo: order.store?.logo || order?.logo,
                customerEmail: order.shopper?.email  ,
                categories: uniqueCategories.slice(0, 2),
                additionalCategoriesCount: uniqueCategories.length > 2 ? uniqueCategories.length - 2 : 0,
                status: order.orderStates.length > 0 ? order.orderStates[order.orderStates.length -1].currentState : order.status,
                createdAt: order.createdAt
            };
        });

        return { 
            data,
            pagination: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limit),
                currentPage: Number(page),
                limit: Number(limit),
                hasNex: page < Math.ceil(totalRecords / limit),
                hasPrev: page > 1
            },
        };
    } catch (error) {
        return { error: error.message || "Failed to fetch transactions" };
    }
};

 
exports.getStoreDashboardStats  = async (storeId) => {
    try {
        const now = new Date();

        // Month range boundaries (Africa/Lagos WAT)
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const [stats] = await OrderModel.aggregate([
            {
                $match: {
                    // Filter by store if querying for a specific vendor dashboard
                    ...(storeId && { storeId: storeId }),
                    status:{$in: [CONSTANTS.ORDER_STATUS_OBJ.completed, CONSTANTS.ORDER_STATUS_OBJ.delivered]},
                    createdAt: { $gte: startOfLastMonth, $lte: now }
                }
            },
            {
                $facet: {
                    // Current Month
                    currentMonth: [
                        { $match: { createdAt: { $gte: startOfCurrentMonth, $lte: now } } },
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                grossValue: { $sum: "$totalAmount" }
                            }
                        }
                    ],
                    // Last Month
                    lastMonth: [
                        { $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                grossValue: { $sum: "$totalAmount" }
                            }
                        }
                    ]
                }
            }
        ]);

        // Extract aggregated totals
        const currentData = stats.currentMonth[0] || {};
        const lastData = stats.lastMonth[0] || {};

        const currentOrdersCount = currentData.totalOrders || 0;
        const lastOrdersCount = lastData.totalOrders || 0;

        const currentGrossValue = currentData.grossValue || 0;
        const lastGrossValue = lastData.grossValue || 0;

        return {
            success: true,
            data: {
                ordersProcessed: {
                    value: currentOrdersCount,
                    percentageChange: calculatePercentageChange(currentOrdersCount, lastOrdersCount)
                },
                grossValue: {
                    value: currentGrossValue,
                    percentageChange: calculatePercentageChange(currentGrossValue, lastGrossValue)
                }
            }
        };

    } catch (error) {
        return { error: error.message || "Failed to fetch store dashboard metrics" };
    }
};

exports.getCurrentMonthDeliveries = async (storeId) => {
    try {
        const now = new Date();

        // Start of the current month (WAT timezone)
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [result] = await OrderModel.aggregate([
            {
                $match: {
                    // Match completed or delivered orders
                    status: {$in: [CONSTANTS.ORDER_STATUS_OBJ.completed, CONSTANTS.ORDER_STATUS_OBJ.delivered]}, // adjust if your status field uses "completed"
                    createdAt: { $gte: startOfCurrentMonth, $lte: now },
                    storeId: storeId }
                
            },
            {
                $group: {
                    _id: null,
                    totalDeliveriesCount: { $sum: 1 }, // Total count of delivered orders
                    totalDeliveryEarnings: { $sum: "$subTotal" } // Total revenue from delivery fees (if applicable)
                }
            }
        ]);

        return {
            success: true,
            data: {
                totalDeliveries: result?.totalDeliveriesCount || 0,
                totalDeliveryEarnings: result?.totalDeliveryEarnings || 0
            }
        };

    } catch (error) {
        return {
            success: false,
            error: error.message || "Failed to calculate current month deliveries"
        };
    }
};