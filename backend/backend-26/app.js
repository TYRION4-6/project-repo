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

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;