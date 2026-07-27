# Google Antigravity Agent Configuration & Rules (`agents.md`)

This workspace-specific rules file defines coding standards, directory structures, environment variables, and agent-specific guidelines for autonomous agents operating on this project.

---

## 1. Project Overview
* **Name**: Metro Retail Inventory Dashboard Backend
* **Runtime**: Node.js (CommonJS, `"type": "commonjs"`)
* **Framework**: Express.js
* **Database**: MongoDB (via Mongoose)
* **Configuration**: Dotenv for environment variables management

---

## 2. Directory Structure & Standards

The project follows a standard MVC-style Express directory structure:

```
backend/
├── config/
│   └── db.js            # MongoDB connection settings
├── middleware/
│   └── auth.js          # JWT Authentication middleware
├── models/
│   ├── User.js          # User schema & password hashing
│   ├── Outlet.js        # Retail outlet branch schema
│   ├── Product.js       # Inventory product schema
│   └── Sale.js          # Sales transaction schema
├── routes/
│   ├── auth.js          # Registration & Login endpoints
│   ├── outlets.js       # Branch management endpoints
│   ├── products.js      # Product inventory endpoints
│   └── sales.js         # POS checkout & sales analytics endpoints
├── app.js               # Entry point of the Express application
├── package.json         # Package configuration and dependencies
└── .env                 # Local environment variables configuration (git-ignored)
```

> [!WARNING]
> **File-Naming Case Sensitivity Warning**:
> All models (`User.js`, `Outlet.js`, `Product.js`, `Sale.js`) use PascalCase.
> When requiring models, always use the exact casing (e.g., `require("../models/Product")`).
> Windows filesystems are case-insensitive, but Linux/macOS environments are case-sensitive. All agents **must** use the exact matching casing to avoid broken imports in production.

---

## 3. Coding Guidelines & Best Practices

### A. JavaScript & Syntax
* Use modern ES6+ features but strictly adhere to **CommonJS module syntax** (`require` / `module.exports`).
* Prefer `async`/`await` over promise chaining for asynchronous operations.
* Use `const` by default, and `let` only if re-assignment is required. Avoid `var`.

### B. Express.js Routing & Controller Design
* Keep routes clean and delegate database models.
* Always handle errors with try/catch blocks in async route handlers and return a structured JSON response:
  ```javascript
  try {
      // Logic here
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
  ```
* Adhere to proper HTTP status codes:
  * `200 OK` for successful read/update operations.
  * `201 Created` for successful resource creation.
  * `400 Bad Request` for client-side validation failures.
  * `401 Unauthorized` for failed auth or invalid token.
  * `404 Not Found` for missing resources.
  * `500 Internal Server Error` for unhandled server exceptions.

### C. Database Operations
* Use Mongoose models and schema definitions.
* Define appropriate constraints on schema properties (e.g., `required: true`, `unique: true`).
* Use composite indices where unique fields are scoped (e.g. unique SKU code per Outlet branch).

---

## 4. Environment Variables (`.env`)

Ensure the following variables are defined in your local `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection URI string | *Required* |
| `PORT` | Port number for the Express server to listen on | `3000` |
| `JWT_SECRET` | Secret key used for signing JWT login tokens | `fallback_secret_for_development` |

---

## 5. Development & Testing Commands

* **Start Production Server**: `npm start` (runs `node app.js`)
* **Development Server (Hot Reload)**: `npm run dev` (runs `nodemon app.js`)
