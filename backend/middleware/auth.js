const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    let token = null;
    
    // Get token from header
    const authHeader = req.header("Authorization");
    if (authHeader) {
        // Check if it is Bearer token
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
            token = parts[1];
        } else {
            return res.status(401).json({ message: "Token format is invalid, must be Bearer <token>" });
        }
    }

    // Fallback: check query parameters (for EventSource/SSE)
    if (!token && req.query.token) {
        token = req.query.token;
    }
    
    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};
