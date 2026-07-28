const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const protect = require("../middleware/auth");
const { isDbReady, inMemoryStore } = require("../config/store");

// GET /api/alerts
router.get("/", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const products = await Product.find().populate("outlet", "name city");
      const alerts = products
        .filter((p) => (p.stockLevel !== undefined ? p.stockLevel : 0) <= (p.lowStockAlertThreshold || 10))
        .map((p) => ({
          _id: p._id,
          id: p._id,
          productName: p.name,
          currentStock: p.stockLevel || 0,
          minThreshold: p.lowStockAlertThreshold || 10,
          outletName: p.outlet ? p.outlet.name : "Metro Branch",
          severity: (p.stockLevel || 0) <= 5 ? "CRITICAL" : "LOW_STOCK",
        }));
      return res.json(alerts);
    }

    const alerts = inMemoryStore.products
      .filter((p) => (p.stockLevel || 0) <= (p.lowStockAlertThreshold || 10))
      .map((p) => {
        const out = inMemoryStore.outlets.find((o) => o._id === p.outlet);
        return {
          _id: p._id,
          id: p._id,
          productName: p.name,
          currentStock: p.stockLevel || 0,
          minThreshold: p.lowStockAlertThreshold || 10,
          outletName: out ? out.name : "Metro Branch",
          severity: (p.stockLevel || 0) <= 5 ? "CRITICAL" : "LOW_STOCK",
        };
      });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
