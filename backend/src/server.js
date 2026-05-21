require("dotenv").config();
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const reportRoutes = require("./routes/reportRoutes");
const express = require('express');
const cors = require('cors');
const connectDB = require("./config/db");

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use("/products", productRoutes);
app.use("/bills", billRoutes);
app.use("/reports", reportRoutes);


app.get("/",(req,res) => {
    res.json({message: "Billing Api Is Running"});

});

app.listen(5000,() => {
    console.log("Server is running on port 5000");
});
app.get("/favicon.ico",(req,res) => {
    res.status(204).end();
});
app.get("/users",(req,res) => {
    res.json([
        {
            id : 1,
            name: "admin",
        },
    ]);
});





