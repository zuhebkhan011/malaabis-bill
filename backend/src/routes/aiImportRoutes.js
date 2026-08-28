/**
 * aiImportRoutes.js
 * Routing for AI-assisted invoice uploads and data extraction.
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const {
  analyzeInvoice,
  commitImport,
  undoImport,
  getBIAnalytics,
  getSuppliers,
  getSupplierProfile,
  searchBI
} = require("../controllers/aiImportController");

router.post("/analyze", upload.single("file"), analyzeInvoice);
router.post("/commit", commitImport);
router.post("/undo", undoImport);
router.get("/analytics", getBIAnalytics);
router.get("/suppliers", getSuppliers);
router.get("/suppliers/:id", getSupplierProfile);
router.get("/search", searchBI);

module.exports = router;
