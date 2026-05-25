const express = require("express");
const { createBill, getBills, updateBillPDF } = require("../controllers/billController");

const router = express.Router();

router.get("/", getBills);
router.post("/checkout", createBill);
router.put("/:id/pdf", updateBillPDF);

module.exports = router;