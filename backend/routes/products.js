const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Outlet = require("../models/Outlet");
const { isDbReady, inMemoryStore, generateId } = require("../config/store");
const { authMiddleware } = require("../middleware/auth");

// Get all products with stock summary across outlets
router.get("/", authMiddleware, async (req, res) => {
  try {
    let productsList = [];
    let inventoriesList = [];
    let outletsList = [];

    if (isDbReady()) {
      productsList = await Product.find().lean();
      inventoriesList = await Inventory.find().lean();
      outletsList = await Outlet.find().lean();
    } else {
      productsList = inMemoryStore.products;
      inventoriesList = inMemoryStore.inventories;
      outletsList = inMemoryStore.outlets;
    }

    const result = productsList.map((prod) => {
      const prodInvs = inventoriesList.filter((inv) => String(inv.productId) === String(prod._id));
      const totalStock = prodInvs.reduce((acc, curr) => acc + (curr.stockQuantity || 0), 0);

      const outletBreakdown = outletsList.map((out) => {
        const matchingInv = prodInvs.find((inv) => String(inv.outletId) === String(out._id));
        return {
          outletId: out._id,
          outletName: out.name,
          city: out.city,
          stock: matchingInv ? matchingInv.stockQuantity : 0,
          isLowStock: matchingInv ? matchingInv.stockQuantity <= (prod.minStockThreshold || 10) : false,
        };
      });

      return {
        ...prod,
        totalStock,
        isLowStock: totalStock <= (prod.minStockThreshold || 10),
        outletBreakdown,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new product & auto-initialize inventory across outlets
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, sku, category, price, costPrice, unit, minStockThreshold, description, initialStockPerOutlet } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: "Name, category, and price are required" });
    }

    const generatedSku = sku || `${category.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const defaultStock = initialStockPerOutlet !== undefined ? Number(initialStockPerOutlet) : 20;

    if (isDbReady()) {
      const newProd = new Product({
        name,
        sku: generatedSku,
        category,
        price: Number(price),
        costPrice: Number(costPrice || price * 0.6),
        unit: unit || "pcs",
        minStockThreshold: Number(minStockThreshold || 15),
        description: description || "",
        managerId: req.user.id,
      });
      await newProd.save();

      // Create initial stock in each outlet
      const outlets = await Outlet.find();
      for (const out of outlets) {
        await Inventory.create({
          outletId: out._id.toString(),
          productId: newProd._id.toString(),
          stockQuantity: defaultStock,
          reorderPoint: Number(minStockThreshold || 15),
        });
      }

      return res.status(201).json(newProd);
    } else {
      const newProd = {
        _id: generateId(),
        name,
        sku: generatedSku,
        category,
        price: Number(price),
        costPrice: Number(costPrice || price * 0.6),
        unit: unit || "pcs",
        minStockThreshold: Number(minStockThreshold || 15),
        description: description || "",
        managerId: req.user.id,
        createdAt: new Date(),
      };
      inMemoryStore.products.unshift(newProd);

      inMemoryStore.outlets.forEach((out) => {
        inMemoryStore.inventories.push({
          _id: generateId(),
          outletId: out._id,
          productId: newProd._id,
          stockQuantity: defaultStock,
          reorderPoint: Number(minStockThreshold || 15),
          lastRestocked: new Date(),
        });
      });

      return res.status(201).json(newProd);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product details
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, category, price, costPrice, unit, minStockThreshold, description } = req.body;

    if (isDbReady()) {
      const updated = await Product.findByIdAndUpdate(
        id,
        { name, sku, category, price, costPrice, unit, minStockThreshold, description },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Product not found" });
      return res.json(updated);
    } else {
      const index = inMemoryStore.products.findIndex((p) => p._id === id);
      if (index === -1) return res.status(404).json({ error: "Product not found" });

      inMemoryStore.products[index] = {
        ...inMemoryStore.products[index],
        ...(name && { name }),
        ...(sku && { sku }),
        ...(category && { category }),
        ...(price !== undefined && { price: Number(price) }),
        ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
        ...(unit && { unit }),
        ...(minStockThreshold !== undefined && { minStockThreshold: Number(minStockThreshold) }),
        ...(description !== undefined && { description }),
      };
      return res.json(inMemoryStore.products[index]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbReady()) {
      await Product.findByIdAndDelete(id);
      await Inventory.deleteMany({ productId: id });
      return res.json({ message: "Product deleted successfully" });
    } else {
      inMemoryStore.products = inMemoryStore.products.filter((p) => p._id !== id);
      inMemoryStore.inventories = inMemoryStore.inventories.filter((i) => i.productId !== id);
      return res.json({ message: "Product deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
