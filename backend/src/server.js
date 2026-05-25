require("dotenv").config();
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const reportRoutes = require("./routes/reportRoutes");
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

app.use(cors());
app.use(express.json());

// Pass Socket.IO instance to all HTTP routes/controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/products", productRoutes);
app.use("/bills", billRoutes);
app.use("/reports", reportRoutes);

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
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





