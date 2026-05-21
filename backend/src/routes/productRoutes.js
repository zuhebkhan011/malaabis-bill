
const express = require('express');

const router = express.Router();
const Product = require("../models/Product");

const { getProducts, createProduct, updateProduct, deleteProduct } = require("../controllers/productController");


router.get("/", getProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;