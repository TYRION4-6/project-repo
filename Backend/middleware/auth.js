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
    `${req.method} ${req.originalUrl || req.url}`,
    `IP=${req.ip}`,
    `Time=${new Date().toISOString()}`,
    `Reason="${reason}"`,
  ].join(" | ");
  console.warn(entry);
}

/**
 * Core JWT verification middleware.
 *
 * 1. Extracts the token from the `Authorization: Bearer <token>` header or `x-auth-token`.
 * 2. Verifies the token signature and expiry against JWT_SECRET.
 * 3. Confirms the referenced user still exists in the database.
 * 4. Attaches `req.user` (decoded payload with fresh role) for downstream handlers.
 *
 * Returns 401 with a JSON `{ msg }` body on any failure and logs the attempt.
 */
async function auth(req, res, next) {
  // --- 1. Extract token from Authorization or x-auth-token header ---
  const authHeader =
    req.header("Authorization") ||
    req.header("authorization") ||
    req.header("x-auth-token");

  if (!authHeader || !authHeader.trim()) {
    logUnauthorized(req, "No Authorization header provided");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  let token;
  const trimmedHeader = authHeader.trim();

  if (trimmedHeader.startsWith("Bearer ") || trimmedHeader.startsWith("bearer ")) {
    token = trimmedHeader.substring(7).trim();
  } else if (!trimmedHeader.includes(" ")) {
    token = trimmedHeader;
  } else {
    const parts = trimmedHeader.split(/\s+/);
    if (parts.length === 2 && (parts[0] === "Bearer" || parts[0] === "bearer")) {
      token = parts[1];
    } else {
      logUnauthorized(req, "Invalid token format (expected 'Bearer <token>')");
      return res.status(401).json({ msg: "Token format is invalid" });
    }
  }

  if (!token) {
    logUnauthorized(req, "Empty token provided");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // --- 2. Verify token validity ---
  try {
    const jwtSecret =
      process.env.JWT_SECRET || "supersecretkeyformetrocitydashboard";
    const decoded = jwt.verify(token, jwtSecret);

    const payloadUser = decoded.user || decoded;

    if (!payloadUser || !payloadUser.id) {
      logUnauthorized(req, "Invalid token payload structure");
      return res.status(401).json({ msg: "Token is not valid" });
    }

    req.user = payloadUser;

    // --- 3. Confirm user still exists in the database ---
    let user;
    try {
      user = await User.findById(req.user.id);
    } catch (dbErr) {
      logUnauthorized(req, `Invalid user ID in token (${dbErr.message})`);
      return res.status(401).json({ msg: "Token is not valid" });
    }

    if (!user) {
      logUnauthorized(req, "User not found in database (stale token)");
      return res
        .status(401)
        .json({ msg: "Token is not valid, user not found" });
    }

    // Attach fresh role from the database for downstream use
    req.user.role = user.role || req.user.role || "manager";

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
 *   // Or at router mount:
 *   app.use("/api/outlets", auth, managerOnly, outletsRouter);
 */
function managerOnly(req, res, next) {
  const role = req.user && req.user.role;

  if (role !== "manager") {
    logUnauthorized(
      req,
      `Insufficient role (has "${role || "none"}", needs "manager")`
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
module.exports.logUnauthorized = logUnauthorized;

