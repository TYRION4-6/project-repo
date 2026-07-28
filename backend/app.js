const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const { seedInitialData } = require("./config/store");

const authRouter = require("./routes/auth");
const outletsRouter = require("./routes/outlets");
const productsRouter = require("./routes/products");
const inventoryRouter = require("./routes/inventory");
const salesRouter = require("./routes/sales");
const alertsRouter = require("./routes/alerts");
const seedRouter = require("./routes/seed");
const studentsRouter = require("./routes/students");

const app = express();

// Connect DB & Trigger initial seed setup
connectDB().then(() => {
  seedInitialData();
});

app.use(cors());
app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Route bindings
app.use("/api/auth", authRouter);
app.use("/api/outlets", outletsRouter);
app.use("/api/products", productsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/sales", salesRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/seed", seedRouter);
app.use("/api/students", studentsRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date(), app: "Shipbasket Enterprise Multi-Branch Portal" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
