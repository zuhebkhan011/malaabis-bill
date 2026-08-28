/**
 * aiAssistantRoutes.js
 * Exposes chat endpoint for Malaabis AI Store Assistant.
 */

const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/aiAssistantController");

router.post("/chat", handleChat);

module.exports = router;
