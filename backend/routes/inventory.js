const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const { isDbReady, inMemoryStore, generateId } = require("../config/store");
const { authMiddleware } = require("../middleware/auth");

// Get full inventory matrix
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { outletId } = req.query;

    let inventories = [];
    let products = [];
    let outlets = [];

    if (isDbReady()) {
      inventories = await Inventory.find(outletId ? { outletId } : {}).lean();
      products = await Product.find().lean();
      outlets = await Outlet.find().lean();
    } else {
      inventories = outletId
        ? inMemoryStore.inventories.filter((i) => String(i.outletId) === String(outletId))
        : inMemoryStore.inventories;
      products = inMemoryStore.products;
      outlets = inMemoryStore.outlets;
    }

    const result = inventories.map((inv) => {
      const prod = products.find((p) => String(p._id) === String(inv.productId));
      const out = outlets.find((o) => String(o._id) === String(inv.outletId));
      const minThreshold = prod ? prod.minStockThreshold : 15;
      const isCritical = inv.stockQuantity <= 5;
      const isWarning = inv.stockQuantity <= minThreshold;

      return {
        ...inv,
        productName: prod ? prod.name : "Unknown Product",
        sku: prod ? prod.sku : "N/A",
        category: prod ? prod.category : "General",
        unitPrice: prod ? prod.price : 0,
        minStockThreshold: minThreshold,
        outletName: out ? out.name : "Unknown Branch",
        city: out ? out.city : "Unknown City",
        locality: out ? out.locality : "",
        statusAlert: isCritical ? "Critical" : isWarning ? "Warning" : "Optimal",
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update specific stock item quantity directly
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { outletId, productId, stockQuantity } = req.body;

    if (!outletId || !productId || stockQuantity === undefined) {
      return res.status(400).json({ error: "outletId, productId, and stockQuantity are required" });
    }

    if (isDbReady()) {
      let inv = await Inventory.findOne({ outletId, productId });
      if (!inv) {
        inv = new Inventory({ outletId, productId, stockQuantity: Number(stockQuantity), lastRestocked: new Date() });
      } else {
        inv.stockQuantity = Number(stockQuantity);
        inv.lastRestocked = new Date();
      }
      await inv.save();
      return res.json(inv);
    } else {
      let inv = inMemoryStore.inventories.find(
        (i) => String(i.outletId) === String(outletId) && String(i.productId) === String(productId)
      );
      if (!inv) {
        inv = {
          _id: generateId(),
          outletId,
          productId,
          stockQuantity: Number(stockQuantity),
          reorderPoint: 10,
          lastRestocked: new Date(),
        };
        inMemoryStore.inventories.push(inv);
      } else {
        inv.stockQuantity = Number(stockQuantity);
        inv.lastRestocked = new Date();
      }
      return res.json(inv);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick Restock API (+ quantity added to current stock)
router.post("/restock", authMiddleware, async (req, res) => {
  try {
    const { outletId, productId, quantityToAdd } = req.body;

    if (!outletId || !productId || !quantityToAdd) {
      return res.status(400).json({ error: "outletId, productId, and quantityToAdd are required" });
    }

    const qty = Number(quantityToAdd);

    if (isDbReady()) {
      let inv = await Inventory.findOne({ outletId, productId });
      if (!inv) {
        inv = new Inventory({ outletId, productId, stockQuantity: qty, lastRestocked: new Date() });
      } else {
        inv.stockQuantity += qty;
        inv.lastRestocked = new Date();
      }
      await inv.save();
      return res.json({ message: "Stock replenished successfully", inventory: inv });
    } else {
      let inv = inMemoryStore.inventories.find(
        (i) => String(i.outletId) === String(outletId) && String(i.productId) === String(productId)
      );
      if (!inv) {
        inv = {
          _id: generateId(),
          outletId,
          productId,
          stockQuantity: qty,
          reorderPoint: 10,
          lastRestocked: new Date(),
        };
        inMemoryStore.inventories.push(inv);
      } else {
        inv.stockQuantity += qty;
        inv.lastRestocked = new Date();
      }
      return res.json({ message: "Stock replenished successfully", inventory: inv });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inventory Alert System Endpoint
router.get("/alerts", authMiddleware, async (req, res) => {
  try {
    let inventories = [];
    let products = [];
    let outlets = [];

    if (isDbReady()) {
      inventories = await Inventory.find().lean();
      products = await Product.find().lean();
      outlets = await Outlet.find().lean();
    } else {
      inventories = inMemoryStore.inventories;
      products = inMemoryStore.products;
      outlets = inMemoryStore.outlets;
    }

    const alerts = [];

    inventories.forEach((inv) => {
      const prod = products.find((p) => String(p._id) === String(inv.productId));
      const out = outlets.find((o) => String(o._id) === String(inv.outletId));
      const threshold = prod ? prod.minStockThreshold : 15;

      if (inv.stockQuantity <= threshold) {
        const severity = inv.stockQuantity <= 5 ? "CRITICAL" : "WARNING";
        const suggestedReorder = Math.max(30, threshold * 2 - inv.stockQuantity);

        alerts.push({
          id: inv._id,
          outletId: inv.outletId,
          outletName: out ? out.name : "Unknown Branch",
          city: out ? out.city : "Metro Branch",
          productId: inv.productId,
          productName: prod ? prod.name : "Product",
          sku: prod ? prod.sku : "SKU",
          category: prod ? prod.category : "General",
          currentStock: inv.stockQuantity,
          minThreshold: threshold,
          severity,
          suggestedReorderQty: suggestedReorder,
          lastRestocked: inv.lastRestocked,
        });
      }
    });

    // Sort by severity (CRITICAL first, then lowest stock)
    alerts.sort((a, b) => {
      if (a.severity === "CRITICAL" && b.severity !== "CRITICAL") return -1;
      if (a.severity !== "CRITICAL" && b.severity === "CRITICAL") return 1;
      return a.currentStock - b.currentStock;
    });

    const summary = {
      totalAlerts: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === "CRITICAL").length,
      warningCount: alerts.filter((a) => a.severity === "WARNING").length,
      alerts,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
