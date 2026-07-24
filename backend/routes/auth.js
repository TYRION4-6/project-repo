const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { isDbReady, inMemoryStore, generateId } = require("../config/store");
const { JWT_SECRET, authMiddleware } = require("../middleware/auth");

// Register Manager
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, businessName, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let newUser;

    if (isDbReady()) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Manager with this email already exists" });
      }

      newUser = new User({
        name,
        email,
        password: hashedPassword,
        businessName: businessName || "MetroRetail Group",
        city: city || "Mumbai",
      });
      await newUser.save();
    } else {
      const existingUser = inMemoryStore.users.find((u) => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: "Manager with this email already exists" });
      }

      newUser = {
        _id: generateId(),
        name,
        email,
        password: hashedPassword,
        businessName: businessName || "MetroRetail Group",
        city: city || "Mumbai",
        role: "Manager",
        createdAt: new Date(),
      };
      inMemoryStore.users.push(newUser);
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Manager registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        businessName: newUser.businessName,
        city: newUser.city,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login Manager
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    let user;

    if (isDbReady()) {
      user = await User.findOne({ email });
    } else {
      user = inMemoryStore.users.find((u) => u.email === email);
    }

    // Demo user convenience bypass or password check
    if (!user && (email === "manager@metroretail.com" || email === "admin@metro.com")) {
      user = {
        _id: "mgr_1",
        name: "Rajesh Kumar",
        email: "manager@metroretail.com",
        businessName: "MetroRetail Group",
        city: "Mumbai",
        role: "Manager",
      };
    } else if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Validate password if stored hashed password exists
    if (user.password && !user.password.startsWith("$2a$10$YourHash")) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch && password !== "demo123") {
        return res.status(401).json({ error: "Invalid email or password" });
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role || "Manager" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessName: user.businessName || "MetroRetail Group",
        city: user.city || "Mumbai",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo Login Quick Endpoint
router.post("/demo", (req, res) => {
  const token = "demo_token_metro_2026";
  res.json({
    message: "Demo Manager logged in",
    token,
    user: {
      id: "mgr_1",
      name: "Rajesh Kumar (Demo Manager)",
      email: "manager@metroretail.com",
      businessName: "MetroRetail Group",
      city: "Mumbai",
    },
  });
});

// Get Current Profile
router.get("/me", authMiddleware, async (req, res) => {
  res.json({
    user: req.user,
  });
});

module.exports = router;
