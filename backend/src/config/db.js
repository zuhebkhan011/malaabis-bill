const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      minPoolSize: 5,
      maxPoolSize: 25,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 60000,
    });
    console.log("mongoose connected successfully (pool pre-warmed)");

    // Pre-warm schemas, models, and connection pool immediately on startup
    setTimeout(async () => {
      try {
        const Product = require("../models/Product");
        const Bill = require("../models/Bill");
        const Setting = require("../models/Setting");
        await Promise.all([
          Product.findOne().select("_id").lean().catch(() => {}),
          Bill.findOne().select("_id").lean().catch(() => {}),
          Setting.findOne().select("_id").lean().catch(() => {}),
          Product.init().catch(() => {}),
          Bill.init().catch(() => {}),
        ]);
        console.log("Database models and indexes pre-warmed for instant billing operations");
      } catch (warmErr) {
        console.warn("Warm-up routine warning:", warmErr.message);
      }
    }, 100);

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;