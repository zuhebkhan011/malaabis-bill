const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load connection URL from .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
  console.error("❌ Error: MONGO_URL not found in backend/.env file.");
  process.exit(1);
}

async function reset() {
  try {
    console.log("🔌 Connecting to MongoDB Atlas Cloud...");
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected successfully!");

    const db = mongoose.connection.db;

    // 1. DELETE ALL INVOICES / BILLING RECORDS
    console.log("\n🧹 Deleting all sales invoices (bills)...");
    await db.collection("bills").deleteMany({});
    console.log("✅ Dropped all old invoices successfully! (Sales dashboard is now reset)");

    // 2. DELETE ALL PRODUCTS (Optional)
    // Uncomment the lines below ONLY if you also want to delete all products/inventory:
    /*
    console.log("\n🧹 Deleting all products from inventory...");
    await db.collection("products").deleteMany({});
    console.log("✅ Dropped all products successfully!");
    */

    console.log("\n🎉 Database reset process complete! Your app is ready for a clean start.");
  } catch (err) {
    console.error("❌ Error resetting database:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

reset();
