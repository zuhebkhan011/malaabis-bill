const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

const saveBase64Image = async (base64Data) => {
  if (!base64Data || typeof base64Data !== "string") return "";

  // If already uploaded or a remote URL, return as is
  if (!base64Data.startsWith("data:")) {
    return base64Data;
  }

  try {
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image string format");
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const dataBuffer = Buffer.from(matches[2], "base64");

    const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadsDir = path.join(__dirname, "../../uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, dataBuffer);

    return `/uploads/${fileName}`;
  } catch (err) {
    console.error("❌ Failed to save base64 image locally:", err);
    throw err;
  }
};

const deleteLocalImage = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return;

  // Only delete local uploaded files
  if (!imagePath.startsWith("/uploads/")) return;

  try {
    const fileName = imagePath.replace("/uploads/", "");
    const filePath = path.join(__dirname, "../../uploads", fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🧹 Deleted local file: " + filePath);
    }
  } catch (err) {
    console.error("❌ Failed to delete local image file: " + imagePath, err);
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const imagesData = req.body.images || [];
    const processedImages = [];

    // Fallback: If images array is empty but imageUrl exists
    if (imagesData.length === 0 && req.body.imageUrl) {
      imagesData.push(req.body.imageUrl);
    }

    for (const img of imagesData) {
      if (!img) continue;
      const savedPath = await saveBase64Image(img);
      if (savedPath) {
        processedImages.push(savedPath);
      }
    }

    req.body.images = processedImages;
    req.body.imageUrl = processedImages[0] || req.body.imageUrl || "";

    const product = await Product.create(req.body);

    if (req.io) {
      req.io.emit("product-created", product);
      req.io.emit("reports-updated", { type: "product", action: "create" });
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imagesData = req.body.images || [];
    const processedImages = [];

    // Identify deleted local images to clean up disk space
    const newPaths = new Set(imagesData.filter(i => i && !i.startsWith("data:")));
    const oldImages = existingProduct.images || [];

    for (const oldImg of oldImages) {
      if (oldImg && !newPaths.has(oldImg)) {
        deleteLocalImage(oldImg);
      }
    }

    for (const img of imagesData) {
      if (!img) continue;
      const savedPath = await saveBase64Image(img);
      if (savedPath) {
        processedImages.push(savedPath);
      }
    }

    req.body.images = processedImages;
    req.body.imageUrl = processedImages[0] || req.body.imageUrl || "";

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (req.io && product) {
      req.io.emit("product-updated", product);
      req.io.emit("stock-updated", { productId: product._id, stock: product.stock });
      req.io.emit("reports-updated", { type: "product", action: "update" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const oldImages = product.images || [];
      for (const oldImg of oldImages) {
        deleteLocalImage(oldImg);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    if (req.io) {
      req.io.emit("product-deleted", { id: req.params.id });
      req.io.emit("reports-updated", { type: "product", action: "delete" });
    }

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const systemResetDatabase = async (req, res) => {
  try {
    const Product = require("../models/Product");
    const Bill = require("../models/Bill");

    console.log("⚠️ Database system reset triggered via API.");
    await Product.deleteMany({});
    await Bill.deleteMany({});
    console.log("✅ Dropped products and bills successfully from MongoDB.");

    if (req.io) {
      req.io.emit("database-reset");
      console.log("📡 Emitted database-reset socket event to all active clients.");
    }

    res.json({ message: "Database reset completely and successfully!" });
  } catch (error) {
    console.error("❌ Database reset API error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  systemResetDatabase,
};


  