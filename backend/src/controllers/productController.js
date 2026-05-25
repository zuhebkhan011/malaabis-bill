const Product = require("../models/Product");

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
    const product = await Product.create(req.body);

    // Emit live events to all connected sockets
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
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    // Emit live events to all connected sockets
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
    await Product.findByIdAndDelete(req.params.id);

    // Emit live events to all connected sockets
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

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};


  