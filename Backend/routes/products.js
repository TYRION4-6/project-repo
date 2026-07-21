const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Outlet = require("../models/Outlet");
const { auth, managerOnly } = require("../middleware/auth");

// Defence-in-depth: enforce JWT + manager role at the router level.
router.use(auth, managerOnly);

// @route   GET /products
// @desc    Get all products
// @access  Private (Manager)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("stock.outletId", "name city")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /products
// @desc    Create a new product
// @access  Private (Manager)
router.post("/", async (req, res) => {
  const { name, sku, category, price, description, stock } = req.body;

  if (!name || !sku || !category || !price) {
    return res.status(400).json({ msg: "Please enter name, SKU, category, and price" });
  }

  try {
    // Check if SKU exists
    let existingProduct = await Product.findOne({ sku });
    if (existingProduct) {
      return res.status(400).json({ msg: "A product with this SKU already exists" });
    }

    // Format stock if provided
    let formattedStock = [];
    if (stock && Array.isArray(stock)) {
      formattedStock = stock.map(item => ({
        outletId: item.outletId,
        quantity: Math.max(0, parseInt(item.quantity) || 0)
      }));
    }

    const newProduct = new Product({
      name,
      sku,
      category,
      price: parseFloat(price),
      description,
      stock: formattedStock
    });

    const product = await newProduct.save();
    
    const populatedProduct = await Product.findById(product._id).populate("stock.outletId", "name city");
    res.json(populatedProduct);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   PUT /products/:id
// @desc    Update a product
// @access  Private (Manager)
router.put("/:id", async (req, res) => {
  const { name, sku, category, price, description } = req.body;

  // Build update object
  const updateFields = {};
  if (name) updateFields.name = name;
  if (sku) {
    // Check if another product has this SKU
    const existingProduct = await Product.findOne({ sku, _id: { $ne: req.params.id } });
    if (existingProduct) {
      return res.status(400).json({ msg: "A product with this SKU already exists" });
    }
    updateFields.sku = sku;
  }
  if (category) updateFields.category = category;
  if (price !== undefined) updateFields.price = parseFloat(price);
  if (description !== undefined) updateFields.description = description;

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).populate("stock.outletId", "name city");

    res.json(product);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   POST /products/:id/stock
// @desc    Update or add stock level for a specific outlet
// @access  Private (Manager)
router.post("/:id/stock", async (req, res) => {
  const { outletId, quantity } = req.body;

  if (!outletId || quantity === undefined) {
    return res.status(400).json({ msg: "Please specify outletId and quantity" });
  }

  const qty = Math.max(0, parseInt(quantity));

  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Verify outlet exists
    const outlet = await Outlet.findById(outletId);
    if (!outlet) {
      return res.status(404).json({ msg: "Outlet not found" });
    }

    // Check if stock entry already exists for this outlet
    const stockIndex = product.stock.findIndex(
      item => item.outletId.toString() === outletId.toString()
    );

    if (stockIndex >= 0) {
      // Update existing stock
      product.stock[stockIndex].quantity = qty;
    } else {
      // Add new stock entry
      product.stock.push({ outletId, quantity: qty });
    }

    await product.save();

    const updatedProduct = await Product.findById(req.params.id).populate("stock.outletId", "name city");
    res.json(updatedProduct);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Product/Outlet not found" });
    }
    res.status(500).send("Server error");
  }
});

// @route   DELETE /products/:id
// @desc    Delete a product
// @access  Private (Manager)
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: "Product removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(500).send("Server error");
  }
});

module.exports = router;
