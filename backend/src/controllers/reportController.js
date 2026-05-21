const Bill = require("../models/Bill");
const Product = require("../models/Product");

const getStartOfDayInTz = (date, tz) => {
  try {
    const tzString = date.toLocaleString("en-US", { timeZone: tz });
    const localDate = new Date(tzString);
    const diff = date.getTime() - localDate.getTime();
    const startOfTodayLocal = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
    return new Date(startOfTodayLocal.getTime() + diff);
  } catch (e) {
    const fallback = new Date(date);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
};

const getStartOfMonthInTz = (date, tz) => {
  try {
    const tzString = date.toLocaleString("en-US", { timeZone: tz });
    const localDate = new Date(tzString);
    const diff = date.getTime() - localDate.getTime();
    const startOfMonthLocal = new Date(localDate.getFullYear(), localDate.getMonth(), 1);
    return new Date(startOfMonthLocal.getTime() + diff);
  } catch (e) {
    const fallback = new Date(date);
    fallback.setDate(1);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }
};

const TIMEFRAME_CONFIG = {
  DAILY: {
    label: "hour",
    unit: "hour",
    startOfWindow: (timezone) => {
      return getStartOfDayInTz(new Date(), timezone);
    },
  },
  WEEKLY: {
    label: "day",
    unit: "day",
    startOfWindow: (timezone) => {
      const startToday = getStartOfDayInTz(new Date(), timezone);
      startToday.setDate(startToday.getDate() - 6);
      return startToday;
    },
  },
  MONTHLY: {
    label: "day",
    unit: "day",
    startOfWindow: (timezone) => {
      return getStartOfMonthInTz(new Date(), timezone);
    },
  },
};

const toKeyLabel = (value, unit) => {
  if (unit === "hour") {
    const hour = Number(value);
    return `${String(hour).padStart(2, "0")}h`;
  }

  if (typeof value === "string" && value.includes("T")) {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return String(value);
};

const buildSeries = (docs, timeframe, timezone) => {
  const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG.WEEKLY;
  const bucketMap = new Map();

  docs.forEach((entry) => {
    const bucketValue = config.unit === "hour"
      ? Number(entry._id)
      : String(entry._id);

    const key = String(bucketValue);
    bucketMap.set(key, {
      key,
      label: config.unit === "hour" ? toKeyLabel(bucketValue, "hour") : toKeyLabel(entry._id, "day"),
      total: Number(entry.total || 0),
      orders: Number(entry.orders || 0),
    });
  });

  const ordered = [];
  if (config.unit === "hour") {
    for (let hour = 0; hour <= 23; hour += 1) {
      const key = String(hour);
      const point = bucketMap.get(key);
      ordered.push({
        key,
        label: `${String(hour).padStart(2, "0")}:00`,
        total: point?.total || 0,
        orders: point?.orders || 0,
      });
    }
    return ordered;
  }

  const start = new Date(TIMEFRAME_CONFIG[timeframe].startOfWindow(timezone));
  const days = [];
  const totalDays = timeframe === "MONTHLY" ? new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate() : 7;

  const getLocalDateKey = (date, tz) => {
    try {
      return new Intl.DateTimeFormat("fr-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    } catch (e) {
      return date.toISOString().slice(0, 10);
    }
  };

  const getLocalDateLabel = (date, tz) => {
    try {
      return date.toLocaleDateString(undefined, { timeZone: tz, month: "short", day: "numeric" });
    } catch (e) {
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
  };

  for (let offset = 0; offset < totalDays; offset += 1) {
    const current = new Date(start);
    current.setDate(start.getDate() + offset);
    const key = getLocalDateKey(current, timezone);
    const point = bucketMap.get(key);
    days.push({
      key,
      label: getLocalDateLabel(current, timezone),
      total: point?.total || 0,
      orders: point?.orders || 0,
    });
  }

  return days;
};

const getReportsDashboard = async (req, res) => {
  try {
    const timeframe = String(req.query.timeframe || "WEEKLY").toUpperCase();
    const config = TIMEFRAME_CONFIG[timeframe] || TIMEFRAME_CONFIG.WEEKLY;
    const timezone = String(req.query.timezone || "UTC");

    const now = new Date();
    const startOfToday = getStartOfDayInTz(now, timezone);
    const startOfMonth = getStartOfMonthInTz(now, timezone);

    const [todaySalesAgg, monthlySalesAgg, allBillsAgg, topProductsAgg, lowStockProducts, inventoryAgg, paymentAgg, chartAgg] = await Promise.all([
      Bill.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        {
          $group: {
            _id: null,
            monthlyRevenue: { $sum: "$total" },
          },
        },
      ]),
      Bill.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$total" },
          },
        },
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            name: { $first: "$items.name" },
            sku: { $first: "$items.sku" },
            quantitySold: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.lineTotal" },
          },
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: 5 },
      ]),
      Product.find({ stock: { $lte: 5 } }).sort({ stock: 1, name: 1 }).limit(8),
      Product.aggregate([
        {
          $group: {
            _id: null,
            inventoryValue: { $sum: { $multiply: ["$price", "$stock"] } },
            totalProducts: { $sum: 1 },
            totalStockUnits: { $sum: "$stock" },
          },
        },
      ]),
      Bill.aggregate([
        {
          $group: {
            _id: { $toUpper: "$paymentMethod" },
            totalAmount: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { totalAmount: -1 } },
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: config.startOfWindow(timezone) } } },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: [timeframe, "DAILY"] },
                { $hour: { date: "$createdAt", timezone: timezone } },
                { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: timezone } },
              ],
            },
            total: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const todaySales = todaySalesAgg[0]?.totalSales || 0;
    const todayOrders = todaySalesAgg[0]?.totalOrders || 0;
    const monthlyRevenue = monthlySalesAgg[0]?.monthlyRevenue || 0;
    const allOrders = allBillsAgg[0]?.totalOrders || 0;
    const topSellingProducts = topProductsAgg.map((item) => ({
      id: String(item._id),
      name: item.name,
      sku: item.sku,
      quantitySold: item.quantitySold,
      revenue: item.revenue,
    }));
    const paymentMethodBreakdown = paymentAgg.map((item) => ({
      method: item._id || "UNKNOWN",
      totalAmount: item.totalAmount || 0,
      orders: item.orders || 0,
    }));
    const inventoryValueSummary = inventoryAgg[0] || { inventoryValue: 0, totalProducts: 0, totalStockUnits: 0 };
    const chartSeries = buildSeries(chartAgg, timeframe, timezone);

    res.json({
      timeframe,
      summary: {
        todaySales,
        monthlyRevenue,
        totalOrders: allOrders,
        todayOrders,
        lowStockProducts: lowStockProducts.length,
        inventoryValue: inventoryValueSummary.inventoryValue || 0,
        totalProducts: inventoryValueSummary.totalProducts || 0,
        totalStockUnits: inventoryValueSummary.totalStockUnits || 0,
      },
      charts: {
        sales: chartSeries,
      },
      products: {
        topSelling: topSellingProducts,
        lowStock: lowStockProducts.map((product) => ({
          id: String(product._id),
          name: product.name,
          sku: product.sku,
          stock: product.stock,
          category: product.category,
          price: product.price,
        })),
      },
      billing: {
        paymentMethods: paymentMethodBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReportsDashboard,
};