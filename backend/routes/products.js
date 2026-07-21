const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Sale = require("../models/Sale");
const { protect } = require("../middleware/auth");

// @desc    Get all products
// @route   GET /products
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.outlet) {
      filter.outlet = req.query.outlet;
    }
    const products = await Product.find(filter).populate("outlet", "name city");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get products below a stock threshold
// @route   GET /products/low-stock
// @access  Private
router.get("/low-stock", protect, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await Product.find({ stock: { $lte: threshold } }).populate("outlet", "name city");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get product by ID
// @route   GET /products/:id
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("outlet", "name city");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create product
// @route   POST /products
// @access  Private
router.post("/", protect, async (req, res) => {
  const { name, sku, category, price, stock, outlet } = req.body;

  if (!name || !sku || !category || price === undefined || stock === undefined || !outlet) {
    return res.status(400).json({ message: "Please provide all required fields" });
  }

  try {
    const product = await Product.create({
      name,
      sku,
      category,
      price,
      stock,
      outlet,
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update product
// @route   PUT /products/:id
// @access  Private
router.put("/:id", protect, async (req, res) => {
  const { name, sku, category, price, stock, outlet } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.name = name || product.name;
    product.sku = sku || product.sku;
    product.category = category || product.category;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.outlet = outlet || product.outlet;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete product
// @route   DELETE /products/:id
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Delete associated sales
    await Sale.deleteMany({ product: req.params.id });

    // Delete product
    await Product.deleteOne({ _id: req.params.id });

    res.json({ message: "Product and associated sales records deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
