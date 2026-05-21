const express = require("express");
const { createBill, getBills } = require("../controllers/billController");

const router = express.Router();

router.get("/", getBills);
router.post("/checkout", createBill);

module.exports = router;