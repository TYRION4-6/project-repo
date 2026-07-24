const express = require("express");
const router = express.Router();
const Outlet = require("../models/Outlet");
const Inventory = require("../models/Inventory");
const { isDbReady, inMemoryStore, generateId } = require("../config/store");
const { authMiddleware } = require("../middleware/auth");

// Get all outlets
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (isDbReady()) {
      const outlets = await Outlet.find().sort({ createdAt: -1 });
      return res.json(outlets);
    } else {
      return res.json(inMemoryStore.outlets);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create outlet
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, code, city, locality, contactNumber, status } = req.body;

    if (!name || !city || !locality) {
      return res.status(400).json({ error: "Name, city, and locality are required" });
    }

    const generatedCode = code || `${city.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    if (isDbReady()) {
      const newOutlet = new Outlet({
        name,
        code: generatedCode,
        city,
        locality,
        contactNumber: contactNumber || "",
        status: status || "Active",
        managerId: req.user.id,
      });
      await newOutlet.save();

      // Auto-assign products with initial 0 inventory to this new outlet
      const Product = require("../models/Product");
      const products = await Product.find();
      for (const prod of products) {
        await Inventory.create({
          outletId: newOutlet._id.toString(),
          productId: prod._id.toString(),
          stockQuantity: 15,
          reorderPoint: prod.minStockThreshold || 10,
        });
      }

      return res.status(201).json(newOutlet);
    } else {
      const newOutlet = {
        _id: generateId(),
        name,
        code: generatedCode,
        city,
        locality,
        contactNumber: contactNumber || "",
        status: status || "Active",
        managerId: req.user.id,
        createdAt: new Date(),
      };
      inMemoryStore.outlets.unshift(newOutlet);

      // Auto-assign stock for existing products in memory
      inMemoryStore.products.forEach((prod) => {
        inMemoryStore.inventories.push({
          _id: generateId(),
          outletId: newOutlet._id,
          productId: prod._id,
          stockQuantity: 15,
          reorderPoint: prod.minStockThreshold || 10,
          lastRestocked: new Date(),
        });
      });

      return res.status(201).json(newOutlet);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update outlet
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, city, locality, contactNumber, status } = req.body;

    if (isDbReady()) {
      const updated = await Outlet.findByIdAndUpdate(
        id,
        { name, code, city, locality, contactNumber, status },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Outlet not found" });
      return res.json(updated);
    } else {
      const index = inMemoryStore.outlets.findIndex((o) => o._id === id);
      if (index === -1) return res.status(404).json({ error: "Outlet not found" });

      inMemoryStore.outlets[index] = {
        ...inMemoryStore.outlets[index],
        ...(name && { name }),
        ...(code && { code }),
        ...(city && { city }),
        ...(locality && { locality }),
        ...(contactNumber !== undefined && { contactNumber }),
        ...(status && { status }),
      };
      return res.json(inMemoryStore.outlets[index]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete outlet
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbReady()) {
      await Outlet.findByIdAndDelete(id);
      await Inventory.deleteMany({ outletId: id });
      return res.json({ message: "Outlet deleted successfully" });
    } else {
      inMemoryStore.outlets = inMemoryStore.outlets.filter((o) => o._id !== id);
      inMemoryStore.inventories = inMemoryStore.inventories.filter((i) => i.outletId !== id);
      return res.json({ message: "Outlet deleted successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
