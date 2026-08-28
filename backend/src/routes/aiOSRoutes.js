/**
 * aiOSRoutes.js
 * Exposes endpoints for the Malaabis Retail Operating System.
 */

const express = require("express");
const router = express.Router();
const {
  getOSSummary,
  getOSCustomers,
  getOSReorders,
  getOSHealth,
  getOSBackup,
  postOSRestore
} = require("../controllers/aiOSController");

router.get("/summary", getOSSummary);
router.get("/customers", getOSCustomers);
router.get("/reorders", getOSReorders);
router.get("/health", getOSHealth);
router.get("/backup", getOSBackup);
router.post("/restore", postOSRestore);

module.exports = router;
