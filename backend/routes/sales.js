const express = require("express");
const router = express.Router();
const Sale = require("../models/Sale");
const Inventory = require("../models/Inventory");
const Outlet = require("../models/Outlet");
const Product = require("../models/Product");
const { isDbReady, inMemoryStore, generateId } = require("../config/store");
const { authMiddleware } = require("../middleware/auth");

// Record a new sale & auto-deduct stock in real time
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { outletId, items, paymentMethod, customerPhone } = req.body;

    if (!outletId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "outletId and items array are required" });
    }

    let outletName = "Metro Outlet";
    let productsMap = new Map();

    if (isDbReady()) {
      const out = await Outlet.findById(outletId);
      if (out) outletName = out.name;

      const prodIds = items.map((i) => i.productId);
      const prods = await Product.find({ _id: { $in: prodIds } });
      prods.forEach((p) => productsMap.set(p._id.toString(), p));
    } else {
      const out = inMemoryStore.outlets.find((o) => String(o._id) === String(outletId));
      if (out) outletName = out.name;

      inMemoryStore.products.forEach((p) => productsMap.set(String(p._id), p));
    }

    // Process & calculate items
    let totalAmount = 0;
    const formattedItems = [];

    for (const item of items) {
      const prod = productsMap.get(String(item.productId));
      const productName = item.productName || (prod ? prod.name : "Product");
      const unitPrice = Number(item.unitPrice || (prod ? prod.price : 0));
      const quantity = Number(item.quantity || 1);
      const subtotal = unitPrice * quantity;

      totalAmount += subtotal;

      formattedItems.push({
        productId: item.productId,
        productName,
        quantity,
        unitPrice,
        subtotal,
      });

      // DEDUCT INVENTORY REAL-TIME
      if (isDbReady()) {
        const inv = await Inventory.findOne({ outletId, productId: item.productId });
        if (inv) {
          inv.stockQuantity = Math.max(0, inv.stockQuantity - quantity);
          await inv.save();
        }
      } else {
        const inv = inMemoryStore.inventories.find(
          (i) => String(i.outletId) === String(outletId) && String(i.productId) === String(item.productId)
        );
        if (inv) {
          inv.stockQuantity = Math.max(0, inv.stockQuantity - quantity);
        }
      }
    }

    const saleNumber = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    if (isDbReady()) {
      const newSale = new Sale({
        saleNumber,
        outletId,
        outletName,
        items: formattedItems,
        totalAmount,
        paymentMethod: paymentMethod || "UPI",
        customerPhone: customerPhone || "",
        saleDate: new Date(),
        managerId: req.user.id,
      });
      await newSale.save();
      return res.status(201).json({ message: "Sale recorded & inventory synced in real-time", sale: newSale });
    } else {
      const newSale = {
        _id: generateId(),
        saleNumber,
        outletId,
        outletName,
        items: formattedItems,
        totalAmount,
        paymentMethod: paymentMethod || "UPI",
        customerPhone: customerPhone || "",
        saleDate: new Date(),
        managerId: req.user.id,
      };
      inMemoryStore.sales.unshift(newSale);
      return res.status(201).json({ message: "Sale recorded & inventory synced in real-time", sale: newSale });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales transactions list
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { outletId, limit } = req.query;

    if (isDbReady()) {
      const query = outletId ? { outletId } : {};
      const sales = await Sale.find(query).sort({ saleDate: -1 }).limit(Number(limit) || 100);
      return res.json(sales);
    } else {
      let sales = inMemoryStore.sales;
      if (outletId) sales = sales.filter((s) => String(s.outletId) === String(outletId));
      return res.json(sales.slice(0, Number(limit) || 100));
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Performance Analytics Dashboard Engine
router.get("/analytics", authMiddleware, async (req, res) => {
  try {
    const { outletId } = req.query;

    let sales = [];
    let outlets = [];
    let products = [];
    let inventories = [];

    if (isDbReady()) {
      sales = await Sale.find().lean();
      outlets = await Outlet.find().lean();
      products = await Product.find().lean();
      inventories = await Inventory.find().lean();
    } else {
      sales = inMemoryStore.sales;
      outlets = inMemoryStore.outlets;
      products = inMemoryStore.products;
      inventories = inMemoryStore.inventories;
    }

    if (outletId && outletId !== "ALL") {
      sales = sales.filter((s) => String(s.outletId) === String(outletId));
      inventories = inventories.filter((i) => String(i.outletId) === String(outletId));
    }

    // Key Performance Metrics
    const totalRevenue = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
    const totalOrders = sales.length;

    let totalItemsSold = 0;
    sales.forEach((s) => {
      s.items.forEach((item) => {
        totalItemsSold += item.quantity || 0;
      });
    });

    const activeOutletsCount = outlets.filter((o) => o.status === "Active").length;

    // Calculate Low Stock Alerts Count
    let lowStockCount = 0;
    inventories.forEach((inv) => {
      const prod = products.find((p) => String(p._id) === String(inv.productId));
      const threshold = prod ? prod.minStockThreshold : 15;
      if (inv.stockQuantity <= threshold) {
        lowStockCount++;
      }
    });

    // 1. Daily Sales Trend (Last 7 Days)
    const dailyTrendMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const formattedLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyTrendMap.set(dateStr, { date: formattedLabel, rawDate: dateStr, revenue: 0, orders: 0, units: 0 });
    }

    sales.forEach((s) => {
      const sDateStr = new Date(s.saleDate).toISOString().split("T")[0];
      if (dailyTrendMap.has(sDateStr)) {
        const item = dailyTrendMap.get(sDateStr);
        item.revenue += s.totalAmount || 0;
        item.orders += 1;
        s.items.forEach((it) => (item.units += it.quantity || 0));
      }
    });

    const dailyTrend = Array.from(dailyTrendMap.values());

    // 2. Outlet Performance Comparison
    const outletPerfMap = new Map();
    outlets.forEach((out) => {
      outletPerfMap.set(String(out._id), {
        id: out._id,
        name: out.name.replace("Metro Retail - ", ""),
        city: out.city,
        revenue: 0,
        orders: 0,
        totalStock: 0,
      });
    });

    // Add stock info
    inventories.forEach((inv) => {
      if (outletPerfMap.has(String(inv.outletId))) {
        outletPerfMap.get(String(inv.outletId)).totalStock += inv.stockQuantity || 0;
      }
    });

    // Add sales info
    sales.forEach((s) => {
      if (outletPerfMap.has(String(s.outletId))) {
        const outData = outletPerfMap.get(String(s.outletId));
        outData.revenue += s.totalAmount || 0;
        outData.orders += 1;
      }
    });

    const outletPerformance = Array.from(outletPerfMap.values());

    // 3. Top Selling Products
    const prodSalesMap = new Map();
    sales.forEach((s) => {
      s.items.forEach((it) => {
        const pKey = String(it.productId);
        if (!prodSalesMap.has(pKey)) {
          prodSalesMap.set(pKey, {
            id: pKey,
            name: it.productName,
            revenue: 0,
            unitsSold: 0,
          });
        }
        const pData = prodSalesMap.get(pKey);
        pData.revenue += it.subtotal || 0;
        pData.unitsSold += it.quantity || 0;
      });
    });

    const topProducts = Array.from(prodSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Category Breakdown
    const catMap = new Map();
    sales.forEach((s) => {
      s.items.forEach((it) => {
        const prod = products.find((p) => String(p._id) === String(it.productId));
        const category = prod ? prod.category : "Other";

        if (!catMap.has(category)) {
          catMap.set(category, 0);
        }
        catMap.set(category, catMap.get(category) + (it.subtotal || 0));
      });
    });

    const categoryBreakdown = Array.from(catMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    res.json({
      metrics: {
        totalRevenue,
        totalOrders,
        totalItemsSold,
        activeOutletsCount,
        lowStockCount,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
      dailyTrend,
      outletPerformance,
      topProducts,
      categoryBreakdown,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
