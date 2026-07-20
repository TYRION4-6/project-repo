var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");

const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Routes
const authRouter = require("./routes/auth");
const outletsRouter = require("./routes/outlets");
const productsRouter = require("./routes/products");
const salesRouter = require("./routes/sales");
const studentsRouter = require("./routes/students");

dotenv.config();

connectDB();

var app = express();

// Enable CORS
app.use(cors());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Register routes
app.use("/api/auth", authRouter);
app.use("/api/outlets", outletsRouter);
app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use("/api/students", studentsRouter);

app.use(function (req, res, next) {
  next(createError(404));
});

// Global error handler — return JSON for API routes, HTML for others
app.use(function (err, req, res, next) {
  const status = err.status || 500;

  // API routes always get JSON
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(status).json({
      msg: err.message || "Internal server error",
    });
  }

  // Non-API routes fall back to rendered error page
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(status);
  res.render("error");
});

module.exports = app;