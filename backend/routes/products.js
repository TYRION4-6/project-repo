const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const protect = require("../middleware/auth");
const { isDbReady, inMemoryStore, generateId } = require("../config/store");
const dashboardEmitter = require("../utils/eventEmitter");

// GET /api/products
router.get("/", protect, async (req, res) => {
  try {
    const { page, limit = 50, outlet, category, lowStock, search } = req.query;

    if (isDbReady()) {
      let query = {};
      if (category) query.category = category;
      if (outlet) query.outlet = outlet;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
        ];
      }

      let products = await Product.find(query)
        .populate("outlet", "name city")
        .sort({ createdAt: -1 });

      if (lowStock === "true") {
        products = products.filter((p) => {
          const totalStock = p.stockLevel !== undefined ? p.stockLevel : (p.stock && p.stock.length > 0 ? p.stock.reduce((sum, s) => sum + s.quantity, 0) : 0);
          const thresh = p.lowStockAlertThreshold !== undefined ? p.lowStockAlertThreshold : (p.minStockThreshold || 10);
          return totalStock <= thresh;
        });
      }

      if (page) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const startIndex = (pageNum - 1) * limitNum;
        const paginated = products.slice(startIndex, startIndex + limitNum);
        return res.json({
          products: paginated,
          total: products.length,
          page: pageNum,
          pages: Math.ceil(products.length / limitNum),
        });
      }

      return res.json(products);
    }

    // In-memory fallback
    let prods = [...inMemoryStore.products];
    if (category) prods = prods.filter((p) => p.category === category);
    if (outlet) prods = prods.filter((p) => p.outlet === outlet || (p.outlet && p.outlet._id === outlet));
    if (search) prods = prods.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

    if (lowStock === "true") {
      prods = prods.filter((p) => {
        const totalStock = p.stockLevel !== undefined ? p.stockLevel : (p.stock && p.stock.length > 0 ? p.stock.reduce((sum, s) => sum + s.quantity, 0) : 0);
        const thresh = p.lowStockAlertThreshold !== undefined ? p.lowStockAlertThreshold : (p.minStockThreshold || 10);
        return totalStock <= thresh;
      });
    }

    if (page) {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const startIndex = (pageNum - 1) * limitNum;
      return res.json({
        products: prods.slice(startIndex, startIndex + limitNum),
        total: prods.length,
        page: pageNum,
        pages: Math.ceil(prods.length / limitNum),
      });
    }

    res.json(prods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/alerts/count
router.get("/alerts/count", protect, async (req, res) => {
  try {
    let count = 0;
    if (isDbReady()) {
      const products = await Product.find();
      count = products.filter((p) => p.stockLevel <= (p.lowStockAlertThreshold || 10)).length;
    } else {
      count = inMemoryStore.products.filter((p) => p.stockLevel <= (p.lowStockAlertThreshold || 10)).length;
    }
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id
router.get("/:id", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const product = await Product.findById(req.params.id).populate("outlet", "name city");
      if (!product) return res.status(404).json({ message: "Product not found" });
      return res.json(product);
    }
    const product = inMemoryStore.products.find((p) => p._id === req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products
router.post("/", protect, async (req, res) => {
  const { name, sku, category, price, costPrice, description, stock, stockLevel, outlet, minStockThreshold, lowStockAlertThreshold, image, images } = req.body;
  if (!name || !sku || !category || price === undefined) {
    return res.status(400).json({ message: "Name, SKU, category, and price are required" });
  }

  try {
    const finalStockLevel = stockLevel !== undefined ? stockLevel : 25;
    const finalThreshold = lowStockAlertThreshold || minStockThreshold || 10;
    const firstImg = images && images.length > 0 ? images[0] : (image || "");

    if (isDbReady()) {
      const product = await Product.create({
        name,
        sku,
        category,
        price,
        costPrice: costPrice || 0,
        description,
        stockLevel: finalStockLevel,
        lowStockAlertThreshold: finalThreshold,
        minStockThreshold: finalThreshold,
        stock: stock || [],
        outlet,
        image: firstImg,
        images: images || (image ? [image] : []),
      });

      dashboardEmitter.emit("alert-change", { managerId: req.user._id });
      return res.status(201).json(product);
    }

    const newProd = {
      _id: generateId(),
      name,
      sku,
      category,
      price,
      costPrice: costPrice || 0,
      description,
      stockLevel: finalStockLevel,
      lowStockAlertThreshold: finalThreshold,
      minStockThreshold: finalThreshold,
      stock: stock || [],
      outlet: outlet || (inMemoryStore.outlets[0] ? inMemoryStore.outlets[0]._id : "out_1"),
      image: firstImg,
      images: images || [],
      createdAt: new Date(),
    };

    inMemoryStore.products.unshift(newProd);
    res.status(201).json(newProd);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/products/:id
router.put("/:id", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!product) return res.status(404).json({ message: "Product not found" });
      dashboardEmitter.emit("alert-change", { managerId: req.user._id });
      return res.json(product);
    }

    const idx = inMemoryStore.products.findIndex((p) => p._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Product not found" });

    inMemoryStore.products[idx] = { ...inMemoryStore.products[idx], ...req.body };
    res.json(inMemoryStore.products[idx]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      dashboardEmitter.emit("alert-change", { managerId: req.user._id });
      return res.json({ message: "Product removed successfully" });
    }

    const idx = inMemoryStore.products.findIndex((p) => p._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Product not found" });

    inMemoryStore.products.splice(idx, 1);
    res.json({ message: "Product removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
