const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function (req, res, next) {
  // Get token from header
  const authHeader = req.header("Authorization");
  const requestInfo = `Path: ${req.originalUrl} | Method: ${req.method} | IP: ${req.ip} | Time: ${new Date().toISOString()}`;

  if (!authHeader) {
    console.warn(`[Unauthorized Access Attempt] ${requestInfo} | Reason: No Authorization header provided`);
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Token format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.warn(`[Unauthorized Access Attempt] ${requestInfo} | Reason: Invalid token format`);
    return res.status(401).json({ msg: "Token format is invalid" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
    req.user = decoded.user;

    // Check if user exists in database and is a manager
    const user = await User.findById(req.user.id);
    if (!user) {
      console.warn(`[Unauthorized Access Attempt] ${requestInfo} | Reason: User not found in database`);
      return res.status(401).json({ msg: "Token is not valid, user not found" });
    }

    // Default existing/new users without a defined role to 'manager'
    const role = user.role || decoded.user.role || "manager";
    if (role !== "manager") {
      console.warn(`[Unauthorized Access Attempt] ${requestInfo} | Reason: User is not authorized as manager (Role: ${role})`);
      return res.status(401).json({ msg: "Access denied, managers only" });
    }

    next();
  } catch (err) {
    console.warn(`[Unauthorized Access Attempt] ${requestInfo} | Reason: Token verification failed (${err.message})`);
    res.status(401).json({ msg: "Token is not valid" });
  }
};
