const express = require("express");
const { getSettings, saveSettings } = require("../controllers/settingController");

const router = express.Router();

router.get("/", getSettings);
router.post("/", saveSettings);

module.exports = router;
