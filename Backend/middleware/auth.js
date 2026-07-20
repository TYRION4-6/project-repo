const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Formats a structured log line for unauthorized access attempts.
 * Includes the request path, method, IP, ISO timestamp, and reason.
 *
 * @param {import('express').Request} req - Express request object
 * @param {string} reason - Human-readable denial reason
 */
function logUnauthorized(req, reason) {
  const entry = [
    `[AUTH DENIED]`,
    `${req.method} ${req.originalUrl}`,
    `IP=${req.ip}`,
    `Time=${new Date().toISOString()}`,
    `Reason="${reason}"`,
  ].join(" | ");
  console.warn(entry);
}

/**
 * Core JWT verification middleware.
 *
 * 1. Extracts the token from the `Authorization: Bearer <token>` header.
 * 2. Verifies the token signature and expiry against JWT_SECRET.
 * 3. Confirms the referenced user still exists in the database.
 * 4. Attaches `req.user` (decoded payload) for downstream handlers.
 *
 * Returns 401 with a JSON `{ msg }` body on any failure and logs the attempt.
 */
async function auth(req, res, next) {
  // --- 1. Extract token from Authorization header ---
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    logUnauthorized(req, "No Authorization header provided");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // Expect "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    logUnauthorized(req, "Invalid token format (expected 'Bearer <token>')");
    return res.status(401).json({ msg: "Token format is invalid" });
  }

  const token = parts[1];

  // --- 2. Verify token validity ---
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    );
    req.user = decoded.user;

    // --- 3. Confirm user still exists in the database ---
    const user = await User.findById(req.user.id);
    if (!user) {
      logUnauthorized(req, "User not found in database (stale token)");
      return res
        .status(401)
        .json({ msg: "Token is not valid, user not found" });
    }

    // Attach fresh role from the database for downstream use
    req.user.role = user.role || "manager";

    next();
  } catch (err) {
    // Provide granular error messages depending on failure type
    if (err.name === "TokenExpiredError") {
      logUnauthorized(req, `Token expired at ${err.expiredAt}`);
      return res
        .status(401)
        .json({ msg: "Token has expired, please log in again" });
    }

    if (err.name === "JsonWebTokenError") {
      logUnauthorized(req, `Malformed token (${err.message})`);
      return res.status(401).json({ msg: "Token is not valid" });
    }

    if (err.name === "NotBeforeError") {
      logUnauthorized(req, `Token not yet active (nbf: ${err.date})`);
      return res.status(401).json({ msg: "Token is not yet active" });
    }

    // Catch-all for any unexpected verification error
    logUnauthorized(req, `Token verification failed (${err.message})`);
    return res.status(401).json({ msg: "Token is not valid" });
  }
}

/**
 * Role-gating middleware — restricts access to users with the "manager" role.
 *
 * Must be used AFTER the `auth` middleware so that `req.user.role` is populated.
 *
 * Usage:
 *   router.get("/admin-panel", auth, managerOnly, handler);
 */
function managerOnly(req, res, next) {
  const role = req.user && req.user.role;

  if (role !== "manager") {
    logUnauthorized(
      req,
      `Insufficient role (has "${role}", needs "manager")`
    );
    return res.status(401).json({ msg: "Access denied, managers only" });
  }

  next();
}

// Export both middleware functions.
// `auth` is the default export for backward-compatibility with existing routes.
// `managerOnly` can be composed: router.use(auth, managerOnly)
module.exports = auth;
module.exports.auth = auth;
module.exports.managerOnly = managerOnly;
