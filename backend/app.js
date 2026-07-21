const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/outlets", require("./routes/outlets"));
app.use("/api/products", require("./routes/products"));
app.use("/api/sales", require("./routes/sales"));

// Test Route
app.get("/", (req, res) => {
    res.send("Metro Retail Inventory Dashboard API is Running...");
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});