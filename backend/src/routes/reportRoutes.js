const express = require("express");
const { getReportsDashboard } = require("../controllers/reportController");

const router = express.Router();

router.get("/dashboard", getReportsDashboard);

module.exports = router;