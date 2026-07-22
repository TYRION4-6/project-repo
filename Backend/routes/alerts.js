const express = require("express");
const router = express.Router();
const Alert = require("../models/Alert");

// @route   GET /alerts
// @desc    Get all active stock threshold breach alerts
// @access  Private (Manager)
router.get("/", async (req, res) => {
  try {
    const alerts = await Alert.find()
      .populate("productId", "name sku category price")
      .populate("outletId", "name city")
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
