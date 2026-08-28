const express = require("express");
const { createBill, updateBill, getBills, getBillById, updateBillPDF, deleteBill } = require("../controllers/billController");

const router = express.Router();

router.get("/", getBills);
router.get("/:id", getBillById);
router.post("/checkout", createBill);
router.put("/:id", updateBill);
router.put("/:id/pdf", updateBillPDF);
router.delete("/:id", deleteBill);

module.exports = router;