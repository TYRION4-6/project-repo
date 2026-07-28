const express = require("express");
const router = express.Router();
const Outlet = require("../models/Outlet");
const protect = require("../middleware/auth");
const { isDbReady, inMemoryStore, generateId } = require("../config/store");

// GET /api/outlets
router.get("/", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const outlets = await Outlet.find().sort({ createdAt: -1 });
      return res.json(outlets);
    }
    res.json(inMemoryStore.outlets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/outlets/:id
router.get("/:id", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const outlet = await Outlet.findById(req.params.id);
      if (!outlet) return res.status(404).json({ message: "Outlet not found" });
      return res.json(outlet);
    }
    const outlet = inMemoryStore.outlets.find((o) => o._id === req.params.id);
    if (!outlet) return res.status(404).json({ message: "Outlet not found" });
    res.json(outlet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/outlets
router.post("/", protect, async (req, res) => {
  const { name, code, city, locality, contactNumber, status } = req.body;
  if (!name || !city || !locality) {
    return res.status(400).json({ message: "Name, city, and locality are required" });
  }

  try {
    const generatedCode = code || `${city.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    if (isDbReady()) {
      const outlet = await Outlet.create({
        name,
        code: generatedCode,
        city,
        locality,
        contactNumber: contactNumber || "",
        status: status || "Active",
        manager: req.user._id,
        managerId: req.user._id ? req.user._id.toString() : "mgr_1",
      });
      return res.status(201).json(outlet);
    }

    const newOutlet = {
      _id: generateId(),
      name,
      code: generatedCode,
      city,
      locality,
      contactNumber: contactNumber || "",
      status: status || "Active",
      managerId: req.user._id || "mgr_1",
      createdAt: new Date(),
    };
    inMemoryStore.outlets.unshift(newOutlet);
    res.status(201).json(newOutlet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/outlets/:id
router.put("/:id", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const outlet = await Outlet.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!outlet) return res.status(404).json({ message: "Outlet not found" });
      return res.json(outlet);
    }

    const idx = inMemoryStore.outlets.findIndex((o) => o._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Outlet not found" });

    inMemoryStore.outlets[idx] = { ...inMemoryStore.outlets[idx], ...req.body };
    res.json(inMemoryStore.outlets[idx]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/outlets/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    if (isDbReady()) {
      const outlet = await Outlet.findByIdAndDelete(req.params.id);
      if (!outlet) return res.status(404).json({ message: "Outlet not found" });
      return res.json({ message: "Outlet removed successfully" });
    }

    const idx = inMemoryStore.outlets.findIndex((o) => o._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: "Outlet not found" });

    inMemoryStore.outlets.splice(idx, 1);
    res.json({ message: "Outlet removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
