const express = require("express");
const router = express.Router();
const { seedInitialData } = require("../config/store");

router.post("/", async (req, res) => {
  try {
    await seedInitialData();
    res.json({ message: "Demo data seeded successfully for all metro outlets, products, and sales transactions." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
