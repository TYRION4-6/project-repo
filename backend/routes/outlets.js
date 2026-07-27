const express = require("express");
const router = express.Router();
const Outlet = require("../models/Outlet");
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const auth = require("../middleware/auth");

// @route   POST api/outlets
// @desc    Create a new outlet branch
// @access  Private
router.post("/", auth, async (req, res) => {
    const { name, city, address, phone } = req.body;

    if (!name || !city || !address) {
        return res.status(400).json({ message: "Name, city, and address are required" });
    }

    try {
        const newOutlet = new Outlet({
            name,
            city,
            address,
            phone,
            manager: req.user.id
        });

        const outlet = await newOutlet.save();
        res.status(201).json(outlet);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/outlets
// @desc    Get all outlets for logged-in manager
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        const outlets = await Outlet.find({ manager: req.user.id }).sort({ createdAt: -1 });
        res.json(outlets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   GET api/outlets/:id
// @desc    Get an outlet by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
    try {
        const outlet = await Outlet.findById(req.params.id);

        if (!outlet) {
            return res.status(404).json({ message: "Outlet not found" });
        }

        // Check ownership
        if (outlet.manager.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to access this outlet" });
        }

        res.json(outlet);
    } catch (err) {
        console.error(err.message);
        if (err.kind === "ObjectId") {
            return res.status(404).json({ message: "Outlet not found" });
        }
        res.status(500).send("Server error");
    }
});

// @route   PUT api/outlets/:id
// @desc    Update an outlet branch
// @access  Private
router.put("/:id", auth, async (req, res) => {
    const { name, city, address, phone } = req.body;

    try {
        let outlet = await Outlet.findById(req.params.id);

        if (!outlet) {
            return res.status(404).json({ message: "Outlet not found" });
        }

        // Check ownership
        if (outlet.manager.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to modify this outlet" });
        }

        outlet = await Outlet.findByIdAndUpdate(
            req.params.id,
            { $set: { name, city, address, phone } },
            { new: true }
        );

        res.json(outlet);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

// @route   DELETE api/outlets/:id
// @desc    Delete outlet and associated products and sales
// @access  Private
router.delete("/:id", auth, async (req, res) => {
    try {
        const outlet = await Outlet.findById(req.params.id);

        if (!outlet) {
            return res.status(404).json({ message: "Outlet not found" });
        }

        // Check ownership
        if (outlet.manager.toString() !== req.user.id) {
            return res.status(401).json({ message: "Not authorized to delete this outlet" });
        }

        // Cascade delete: Delete products and sales related to this outlet
        await Product.deleteMany({ outlet: req.params.id });
        await Sale.deleteMany({ outlet: req.params.id });
        await Outlet.findByIdAndDelete(req.params.id);

        res.json({ message: "Outlet and all related products/sales deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});

module.exports = router;
