const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        default: "UNSTITCHED"
    },
    sku: {
        type: String,
    },
    barcode: {
        type: String,
    },
    brand: {
        type: String,
    },
    supplier: {
        type: String,
    },
    purchasePrice: {
        type: Number,
    },
    imageUrl: {
        type: String,
    },
    images: [String],
    status: {
        type: String,
        enum: ["active", "draft"],
        default: "active"
    }
});

module.exports = mongoose.model("Product", productSchema);