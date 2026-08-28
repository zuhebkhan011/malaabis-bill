require("dotenv").config();
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingRoutes = require("./routes/settingRoutes");
const aiImportRoutes = require("./routes/aiImportRoutes");
const aiAssistantRoutes = require("./routes/aiAssistantRoutes");
const aiOSRoutes = require("./routes/aiOSRoutes");
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

connectDB();

const path = require("path");
const fs = require("fs");

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(uploadsDir));

// Pass Socket.IO instance to all HTTP routes/controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/products", productRoutes);
app.use("/bills", billRoutes);
app.use("/reports", reportRoutes);
app.use("/settings", settingRoutes);
app.use("/ai-import", aiImportRoutes);
app.use("/ai-assistant", aiAssistantRoutes);
app.use("/ai-assistant/os", aiOSRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Billing Api Is Running with Live Sync Support" });
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/users", (req, res) => {
  res.json([
    {
      id: 1,
      name: "admin",
    },
  ]);
});

io.on("connection", (socket) => {
  console.log(`Device connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Device disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT} (all interfaces — LAN accessible)`);
});





