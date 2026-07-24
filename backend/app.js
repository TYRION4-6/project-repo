var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const dotenv = require("dotenv");

const { connectDB, getIsConnected } = require("./config/db");
const { seedInitialData } = require("./config/store");

dotenv.config();

// Attempt MongoDB Connection and trigger initial seed
connectDB().then(() => {
  seedInitialData();
});

var app = express();

// Enable CORS for frontend Vite application
app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
const authRouter = require("./routes/auth");
const outletsRouter = require("./routes/outlets");
const productsRouter = require("./routes/products");
const inventoryRouter = require("./routes/inventory");
const salesRouter = require("./routes/sales");
const seedRouter = require("./routes/seed");

app.use("/api/auth", authRouter);
app.use("/api/outlets", outletsRouter);
app.use("/api/products", productsRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/sales", salesRouter);
app.use("/api/seed", seedRouter);

// Legacy route compatibility
const studentsRouter = require("./routes/students");
app.use("/students", studentsRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "MetroStock Realtime Analytics & Inventory API",
    dbConnected: getIsConnected(),
    timestamp: new Date(),
  });
});

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

module.exports = app;