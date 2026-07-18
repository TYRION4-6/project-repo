const express = require("express");
const router = express.Router();
const Outlet = require("../models/Outlet");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const { protect } = require("../middleware/auth");

// @desc    Get all outlets
// @route   GET /outlets
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const outlets = await Outlet.find({}).sort({ name: 1 });
    res.json(outlets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get outlet by ID
// @route   GET /outlets/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    if (!outlet) {
      return res.status(404).json({ message: "Outlet not found" });
    }
    res.json(outlet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create new outlet
// @route   POST /outlets
// @access  Private
router.post("/", protect, async (req, res) => {
  const { name, city, address, phone } = req.body;

  if (!name || !city || !address || !phone) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const outlet = await Outlet.create({
      name,
      city,
      address,
      phone,
    });
    res.status(201).json(outlet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update outlet
// @route   PUT /outlets/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  const { name, city, address, phone } = req.body;

  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({ message: "Outlet not found" });
    }

    outlet.name = name || outlet.name;
    outlet.city = city || outlet.city;
    outlet.address = address || outlet.address;
    outlet.phone = phone || outlet.phone;

    const updatedOutlet = await outlet.save();
    res.json(updatedOutlet);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete outlet and associated data
// @route   DELETE /outlets/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({ message: "Outlet not found" });
    }

    // Delete associated products
    await Product.deleteMany({ outlet: req.params.id });

    // Delete associated sales
    await Sale.deleteMany({ outlet: req.params.id });

    // Delete the outlet
    await outlet.remove ? await outlet.remove() : await Outlet.deleteOne({ _id: req.params.id });

    res.json({ message: "Outlet and all associated products and sales data deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
