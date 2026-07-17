const express = require("express");
const router = express.Router();
const Outlet = require("../models/Outlet");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// @route   GET /outlets
// @desc    Get all outlets
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const outlets = await Outlet.find().sort({ createdAt: -1 });
    res.json(outlets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /outlets
// @desc    Create a new outlet
// @access  Private
router.post("/", auth, async (req, res) => {
  const { name, city, address, phone } = req.body;

  if (!name || !city || !address || !phone) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  // Validate city enum
  const validCities = ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad"];
  if (!validCities.includes(city)) {
    return res.status(400).json({ msg: `Invalid city. Must be one of: ${validCities.join(", ")}` });
  }

  try {
    const newOutlet = new Outlet({
      name,
      city,
      address,
      phone,
    });

    const outlet = await newOutlet.save();
    res.json(outlet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /outlets/:id
// @desc    Update an outlet
// @access  Private
router.put("/:id", auth, async (req, res) => {
  const { name, city, address, phone } = req.body;

  // Build update object
  const updateFields = {};
  if (name) updateFields.name = name;
  if (city) {
    const validCities = ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Hyderabad", "Pune", "Ahmedabad"];
    if (!validCities.includes(city)) {
      return res.status(400).json({ msg: `Invalid city. Must be one of: ${validCities.join(", ")}` });
    }
    updateFields.city = city;
  }
  if (address) updateFields.address = address;
  if (phone) updateFields.phone = phone;

  try {
    let outlet = await Outlet.findById(req.params.id);
    if (!outlet) {
      return res.status(404).json({ msg: "Outlet not found" });
    }

    outlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(outlet);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Outlet not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /outlets/:id
// @desc    Delete an outlet
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);
    if (!outlet) {
      return res.status(404).json({ msg: "Outlet not found" });
    }

    await Outlet.findByIdAndDelete(req.params.id);

    // Pull stock entries related to this outlet from all products
    await Product.updateMany(
      {},
      { $pull: { stock: { outletId: req.params.id } } }
    );

    res.json({ msg: "Outlet removed and product stock items updated" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Outlet not found" });
    }
    res.status(500).send("Server error");
  }
});

module.exports = router;
