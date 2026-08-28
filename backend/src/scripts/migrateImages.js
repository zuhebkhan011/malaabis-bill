const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");

// Load connection URL from backend/.env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
  console.error("❌ Error: MONGO_URL not found in backend/.env file.");
  process.exit(1);
}

const Product = require("../models/Product");

const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
};

async function migrate() {
  try {
    console.log("🔌 Connecting to MongoDB Atlas Cloud...");
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected successfully!");

    const uploadsDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const products = await Product.find({});
    console.log(`🔍 Found ${products.length} products to check...`);

    let migratedCount = 0;

    for (const product of products) {
      // If images array is already populated with a local relative path, skip
      if (product.images && product.images.length > 0 && product.images[0].startsWith("/uploads/")) {
        console.log(`⏭️ Product "${product.name}" already has static local images. Skipping.`);
        continue;
      }

      // Legacy cover image
      let targetImage = product.imageUrl || "";

      // Fallback if empty or not a valid URL
      if (!targetImage || (!targetImage.startsWith("http") && !targetImage.startsWith("data:"))) {
        targetImage = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80";
      }

      try {
        if (targetImage.startsWith("data:")) {
          // Process base64
          const matches = targetImage.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
            const dataBuffer = Buffer.from(matches[2], "base64");
            const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const destPath = path.join(uploadsDir, fileName);
            fs.writeFileSync(destPath, dataBuffer);
            
            const relativePath = `/uploads/${fileName}`;
            product.images = [relativePath];
            product.imageUrl = relativePath;
            await product.save();
            console.log(`✅ Base64 Migrated: "${product.name}" -> ${relativePath}`);
            migratedCount++;
          }
        } else if (targetImage.startsWith("http")) {
          // Process external URL download
          const ext = targetImage.includes(".png") ? "png" : "jpg";
          const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const destPath = path.join(uploadsDir, fileName);
          
          console.log(`📥 Downloading image for "${product.name}"...`);
          await downloadImage(targetImage, destPath);
          
          const relativePath = `/uploads/${fileName}`;
          product.images = [relativePath];
          product.imageUrl = relativePath;
          await product.save();
          console.log(`✅ URL Migrated: "${product.name}" -> ${relativePath}`);
          migratedCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to migrate image for "${product.name}":`, err.message);
      }
    }

    console.log(`\n🎉 Local image migration complete! Migrated ${migratedCount} products successfully.`);
  } catch (err) {
    console.error("❌ Database migration error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrate();
