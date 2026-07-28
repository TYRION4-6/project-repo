const express = require("express");
const router = express.Router();
const { seedInitialData } = require("../config/store");

// POST /api/seed
router.post("/", async (req, res) => {
  try {
    await seedInitialData();
    res.json({ message: "Initial demo dataset successfully seeded across outlets, products, inventory, and sales!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
