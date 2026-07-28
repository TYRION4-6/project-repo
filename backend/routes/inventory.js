const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const protect = require("../middleware/auth");
const { isDbReady, inMemoryStore } = require("../config/store");

// GET /api/inventory
router.get("/", protect, async (req, res) => {
  try {
    const { outletId } = req.query;

    if (isDbReady()) {
      let query = {};
      if (outletId) query.outletId = outletId;
      const invs = await Inventory.find(query);
      return res.json(invs);
    }

    let invs = [...inMemoryStore.inventories];
    if (outletId) invs = invs.filter((i) => i.outletId === outletId);
    res.json(invs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/inventory/stock-update or PUT /api/inventory/update
router.post("/stock-update", protect, async (req, res) => {
  const { outletId, productId, newStock, adjustment, reason } = req.body;
  if (!outletId || !productId) {
    return res.status(400).json({ message: "Outlet ID and Product ID are required" });
  }

  try {
    if (isDbReady()) {
      let prod = await Product.findById(productId);
      if (!prod) return res.status(404).json({ message: "Product not found" });

      let targetStock = newStock !== undefined ? newStock : (prod.stockLevel || 0) + (adjustment || 0);
      prod.stockLevel = Math.max(0, targetStock);
      await prod.save();

      let inv = await Inventory.findOne({ outletId, productId });
      if (inv) {
        inv.stockQuantity = prod.stockLevel;
        inv.lastRestocked = new Date();
        await inv.save();
      } else {
        inv = await Inventory.create({
          outletId,
          productId,
          stockQuantity: prod.stockLevel,
          reorderPoint: prod.lowStockAlertThreshold || 10,
          lastRestocked: new Date(),
        });
      }

      return res.json({ message: "Inventory stock updated successfully", product: prod, inventory: inv });
    }

    // In-memory update
    let prod = inMemoryStore.products.find((p) => p._id === productId);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    let targetStock = newStock !== undefined ? newStock : (prod.stockLevel || 0) + (adjustment || 0);
    prod.stockLevel = Math.max(0, targetStock);

    let inv = inMemoryStore.inventories.find((i) => i.outletId === outletId && i.productId === productId);
    if (inv) {
      inv.stockQuantity = prod.stockLevel;
      inv.lastRestocked = new Date();
    } else {
      inv = {
        _id: `inv_${Date.now()}`,
        outletId,
        productId,
        stockQuantity: prod.stockLevel,
        reorderPoint: prod.lowStockAlertThreshold || 10,
        lastRestocked: new Date(),
      };
      inMemoryStore.inventories.push(inv);
    }

    res.json({ message: "Inventory stock updated successfully", product: prod, inventory: inv });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
