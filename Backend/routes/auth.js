const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new manager/user and return a JWT token
 * @access  Public
 */
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res
        .status(400)
        .json({ msg: "User already exists with this email" });
    }

    // Securely hash the password using bcrypt
    const hashedPassword = await User.hashPassword(password);

    user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "manager",
    });

    await user.save();

    // Issue JWT Token
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    const jwtSecret = process.env.JWT_SECRET || "supersecretkeyformetrocitydashboard";

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ msg: "Server error during registration" });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate manager/user, check bcrypt hashed password, and issue JWT token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== "string" || typeof password !== "string" || !email.trim()) {
    return res.status(400).json({ msg: "Please enter email and password" });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 1. Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 2. Compare hashed password securely using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // 3. Issue JWT Token on successful authentication
    const payload = {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "manager",
      },
    };

    const jwtSecret = process.env.JWT_SECRET || "supersecretkeyformetrocitydashboard";

    jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) {
          console.error("JWT Sign error:", err);
          return res.status(500).json({ msg: "Server error issuing authentication token" });
        }
        // 4. Return token and user info in response
        return res.status(200).json({
          msg: "Login successful",
          token,
          user: payload.user,
        });
      }
    );
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: "Server error during login" });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get authenticated user data from token
 * @access  Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;

