const assert = require("assert");
const { test, describe, before, after, afterEach } = require("node:test");
const jwt = require("jsonwebtoken");
const express = require("express");
const { auth, managerOnly } = require("../middleware/auth");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkeyformetrocitydashboard";

describe("JWT & Role Verification Middleware", () => {
  let app;
  let server;
  let baseUrl;
  let originalFindById;
  let warnLogs = [];
  let originalConsoleWarn;

  before(async () => {
    // Setup Express app for testing middleware
    app = express();
    app.use(express.json());

    // Public route
    app.get("/api/public", (req, res) => res.json({ msg: "public" }));

    // Dashboard routes protected by auth + managerOnly
    app.get("/api/dashboard/outlets", auth, managerOnly, (req, res) => {
      res.json({ msg: "outlets dashboard", user: req.user });
    });

    // General private route protected by auth only
    app.get("/api/general/students", auth, (req, res) => {
      res.json({ msg: "students data", user: req.user });
    });

    // Start local HTTP server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // Mock User.findById database calls
    originalFindById = User.findById;
    User.findById = async (id) => {
      if (id === "manager123") {
        return { _id: "manager123", name: "Manager User", email: "manager@test.com", role: "manager" };
      }
      if (id === "regularuser123") {
        return { _id: "regularuser123", name: "Regular User", email: "user@test.com", role: "user" };
      }
      if (id === "noroleuser123") {
        return { _id: "noroleuser123", name: "No Role User", email: "norole@test.com" };
      }
      return null;
    };

    // Capture console.warn
    originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      warnLogs.push(args.join(" "));
      originalConsoleWarn(...args);
    };
  });

  after(() => {
    if (server) server.close();
    if (originalFindById) User.findById = originalFindById;
    if (originalConsoleWarn) console.warn = originalConsoleWarn;
  });

  afterEach(() => {
    warnLogs = [];
  });

  test("1. Protected routes reject requests without Authorization header with 401", async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/outlets`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.msg, "No token, authorization denied");
    assert.ok(warnLogs.some(log => log.includes("[AUTH DENIED]") && log.includes("No Authorization header provided")));
  });

  test("2. Protected routes reject requests with invalid token format with 401", async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/outlets`, {
      headers: { Authorization: "InvalidFormatTokenHere" }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.msg, "Token is not valid");
    assert.ok(warnLogs.some(log => log.includes("[AUTH DENIED]")));
  });

  test("3. Protected routes reject requests with malformed/fake JWT with 401", async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/outlets`, {
      headers: { Authorization: "Bearer fake.jwt.token" }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.msg, "Token is not valid");
    assert.ok(warnLogs.some(log => log.includes("[AUTH DENIED]") && log.includes("Malformed token")));
  });

  test("4. Protected routes reject expired JWT with 401", async () => {
    const expiredToken = jwt.sign(
      { user: { id: "manager123", role: "manager" } },
      JWT_SECRET,
      { expiresIn: "-1s" }
    );

    const res = await fetch(`${baseUrl}/api/dashboard/outlets`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.msg, "Token has expired, please log in again");
    assert.ok(warnLogs.some(log => log.includes("[AUTH DENIED]") && log.includes("Token expired")));
  });

  test("5. Protected routes reject token with non-existent user with 401", async () => {
    const staleToken = jwt.sign(
      { user: { id: "nonexistent999", role: "manager" } },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await fetch(`${baseUrl}/api/dashboard/outlets`, {
      headers: { Authorization: `Bearer ${staleToken}` }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.msg, "Token is not valid, user not found");
    assert.ok(warnLogs.some(log => log.includes("[AUTH DENIED]") && log.includes("User not found in database")));
  });

  test("6. Valid JWT with manager role allows access to dashboard endpoints with 200 OK", async () => {
    const managerToken = jwt.sign(
      { user: { id: "manager123", role: "manager" } },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await fetch(`${baseUrl}/api/dashboard/outlets`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.msg, "outlets dashboard");
    assert.strictEqual(body.user.id, "manager123");
    assert.strictEqual(body.user.role, "manager");
  });

  test("7. Non-manager role (user) receives 401 on dashboard endpoint and attempt is logged", async () => {
    const userToken = jwt.sign(
      { user: { id: "regularuser123", role: "user" } },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await fetch(`${baseUrl}/api/dashboard/outlets`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.msg, "Access denied, managers only");
    assert.ok(warnLogs.some(log => log.includes("[AUTH DENIED]") && log.includes('Insufficient role (has "user", needs "manager")')));
  });

  test("8. Non-manager user can access non-dashboard general protected route if permitted by auth middleware", async () => {
    const userToken = jwt.sign(
      { user: { id: "regularuser123", role: "user" } },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const res = await fetch(`${baseUrl}/api/general/students`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.msg, "students data");
  });
});
