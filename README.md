# MetroHub | Multi-Branch Inventory & Sales Analytics Dashboard

A MERN-stack enterprise dashboard built for urban businesses with multiple branches in metro cities. It enables real-time synchronization of product catalogs, branch outlet management, sales transaction tracking, and interactive analytics to make data-driven decisions and optimize inventory.

## 🚀 Features

### 🔐 Authentication & Session Control
- Fully secure signup and login flow for business managers.
- JWT-based authentication stored in `localStorage`.
- Protected frontend views and server-side routes.

### 🏢 Metro Outlet Management (CRUD)
- Create and edit physical branch locations in metro cities (Mumbai, Delhi, Bangalore, Kolkata, Chennai, Hyderabad, Pune, Ahmedabad).
- Full listing and removal support. Deleting an outlet automatically reconciles stocks and catalog lists.

### 📦 Product Catalog & Stock Adjustments (CRUD)
- Define unique product catalogs using custom SKUs, categories, pricing, and descriptions.
- Outlet-specific inventory assignment (e.g., Connaught Place branch has 50 units, HSR Layout branch has 10 units).
- Low-stock indicator badges (warning highlight at <= 10 units).
- Dedicated quick stock refill utility.

### 📊 Real-time Transaction Logging & Recharts Analytics
- Transaction recorder with automatic stock checks and real-time subtotal calculations.
- Live dashboard charts using `recharts`:
  - **Revenue Trend**: Line/Area chart demonstrating revenue trends.
  - **Metro Demand**: Bar chart comparing sales performance across cities.
  - **Outlet Share**: Donut pie chart representing revenue shares.
  - **Top-Selling Products**: High-performing SKUs tracker.
  - **Critical Low Stock Alerts**: System warning box highlighting low-stock items for prompt replenishment.

---

## 🛠️ Stack & Architecture

- **Frontend**: React (Vite, SPA, HashRouter, Lucide Icons, Recharts for graphs, CSS Variables for Dark Mode Glassmorphism UI)
- **Backend**: Node.js & Express.js
- **Database**: MongoDB (Mongoose schemas with embedded relational model indexing)
- **Port Mapping**:
  - Backend: `http://localhost:5050`
  - Frontend: `http://localhost:5173`

---

## 💻 Setup & Commands

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local instance (configured in backend `.env` file)

### Running the Application

1. **Backend Server**:
   ```bash
   cd backend/backend-26
   npm install
   npm start
   ```
   *Note: Runs on `http://localhost:5050`*

2. **Frontend Development Server**:
   ```bash
   cd frontend/vite_react/react_5
   npm install
   npm run dev
   ```
   *Note: Runs on `http://localhost:5173`*

----

## 📁 Directory Structure
```
project-repo/
├── backend/backend-26/
│   ├── config/db.js          # MongoDB database connector
│   ├── middleware/auth.js    # JWT authorization validator
│   ├── models/               # Mongoose Schemas (User, Outlet, Product, Sale)
│   ├── routes/               # API route routers (auth, outlets, products, sales)
│   ├── app.js                # Express app middleware configuration
│   └── .env                  # Port, DB, and JWT Secret keys
└── frontend/vite_react/react_5/
    ├── src/
    │   ├── api.js            # Client-side API request handler (with token injection)
    │   ├── components/       # UI Components (Sidebar, Header, DashboardView, OutletsView, ProductsView, SalesView)
    │   ├── App.jsx           # Global state manager and routers
    │   ├── index.css         # Styling system (Glassmorphism layout)
    │   └── main.jsx          # React app mounting file
    └── index.html            # Imports Google Fonts (Outfit)
```