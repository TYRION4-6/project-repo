# 🛒 Shipbasket Enterprise Portal — Final Edition

> **Unified Multi-Branch Inventory Management, POS Checkout Terminal, Analytics & Audit Platform**

Shipbasket Enterprise is a full-stack, enterprise-grade retail operations platform engineered to manage multi-branch outlets, real-time catalog inventory, point-of-sale (POS) terminal checkouts, automated low-stock warnings, and transaction audit logs across major metro cities.

---

## 🌟 Key Features & Capabilities

### 1. 📊 Executive Dashboard & Operations Center
- **Real-Time Operations Summary**: Live sync status badge, today's sales total with exact currency formatting, and live stock alert monitor.
- **Live USD/INR Exchange Rate Integration**: Real-time currency conversion API (`https://open.er-api.com`).
- **Interactive Metric Cards**: Expandable revenue details, transaction counters, active branch counters, and instant navigation shortcuts.
- **Outlet Sales Trend Comparison**: Multi-branch sales comparison line chart built with Recharts, with per-outlet line toggling and currency tooltips.

### 2. 🏪 Multi-Branch Outlet Management
- Full CRUD operations for branch locations across major Indian metros (Mumbai, Delhi, Bangalore, Hyderabad, Pune, Kolkata, Chennai, Ahmedabad).
- Branch code tracking, city, locality, manager assignment, and contact details.

### 3. 📦 Product Catalog & Multi-Picture Gallery
- Catalog management with SKU tracking, category filtering, search, unit pricing, cost price, and min/low stock thresholds.
- **Multi-Photo Gallery System**: Add multiple image URLs per product with preset sample images, `MAIN` photo tags, thumbnail gallery previews, and deletion controls.

### 4. 💳 Point-of-Sale (POS) Terminal & Receipts
- Product catalog scanning and cart management with stock availability validation.
- Automatic **18% GST Tax Calculation**, payment method selection (UPI, Card, Cash, NetBanking), and customer mobile number logging.
- **Printable Thermal Invoices**: Instant printable sales receipt modal (`TXN-XXXXXX`) formatted for POS receipt printers.

### 5. ⚠️ Low Stock Warnings & Quick Refill Center
- Dynamic real-time monitoring classifying stock levels into **Critical (0-5 pcs)** and **Low Stock (6-10 pcs)**.
- **Quick Refill Modal**: In-place restocking with preset quantities (`30 pcs`, `50 pcs`, `100 pcs`, `200 pcs`).
- **Bulk Refill Action**: 1-Click restocking button (+50 pcs for all alert items) and dynamic sidebar notification badge counter.

### 6. 📜 Transaction History & Audit Logs
- Searchable transaction receipts table by Receipt #, Customer Mobile, or Branch Outlet.
- Chronological sorting with newly processed POS checkout transactions appearing instantly at Row 1.
- Detailed receipt view modal with full product breakdown and printing options.

### 7. 🎨 Futuristic UI Aesthetics & Navigation System
- **Auto-Slide Navigation Sidebar**: Edge-triggered mouse detection (reveals when cursor moves within `35px` of left edge, auto-hides on mouse exit).
- **Permanent Sidebar Toggle Button**: Small pin button to lock sidebar permanently visible.
- **Dual Aesthetic Themes**: Luminous Slate Light Mode with ambient radial glows and Dark Glassmorphic Theme.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 (Vite) | Single-Page Application framework |
| **Icons & UI** | Lucide React | Modern SVG icons |
| **Data Viz** | Recharts | Multi-line sales trend graphs & pie charts |
| **Styling** | Custom Vanilla CSS System | CSS Variables design tokens, glassmorphism & gradients |
| **Backend API** | Node.js + Express | RESTful API backend server |
| **Database** | MongoDB + Mongoose | Data persistence (with automated in-memory store fallback) |
| **Authentication**| JWT (JSON Web Tokens) | Secure Bearer token authentication |

---

## 📂 Project Architecture

```
final/
├── package.json               # Root scripts & launcher
├── start_shipbasket.bat       # 1-Click Windows execution script
├── README.md                  # Comprehensive project documentation
├── SCRIPTS.md                 # Execution scripts quick reference
│
├── backend/                   # Node.js + Express REST API Server
│   ├── app.js                 # App configuration & middleware
│   ├── bin/www                # Express HTTP launcher (Port 5050)
│   ├── config/
│   │   ├── db.js              # MongoDB connection setup
│   │   └── store.js           # Shared data store & multi-branch seed generator
│   ├── middleware/
│   │   └── auth.js            # JWT verification & guest mode fallback
│   ├── models/                # Mongoose Models (User, Outlet, Product, Sale, Inventory)
│   └── routes/                # API Routes (auth, outlets, products, sales, inventory)
│
└── frontend/                  # React 18 + Vite Web Client
    ├── index.html             # HTML5 entry document
    ├── vite.config.js         # Vite configuration
    └── src/
        ├── App.jsx            # Application layout, edge sidebar & router
        ├── main.jsx           # React DOM root render
        ├── api.js             # Unified REST API service layer
        ├── index.css          # Design system stylesheet
        └── components/        # Feature Components
            ├── AuthModal.jsx            # Login & manager account registration
            ├── DashboardView.jsx        # Executive dashboard & metrics
            ├── ManagerSummaryWidget.jsx # Real-time operations summary widget
            ├── OutletSalesTrend.jsx     # Recharts per-outlet trend chart
            ├── OutletsView.jsx          # Branch outlets manager
            ├── ProductManager.jsx       # Catalog manager & multi-photo gallery
            ├── POSView.jsx              # POS checkout terminal & receipts
            ├── ThresholdAlerts.jsx      # Low-stock warning & refill center
            └── TransactionsView.jsx     # Sales transaction history & audit receipts
```

---

## 🚀 Getting Started & Execution Guide

### Option 1: 1-Click Windows Batch Script (Recommended)
Double-click `start_shipbasket.bat` in the root folder or execute from Command Prompt:
```cmd
start_shipbasket.bat
```
*Automatically checks for dependencies, installs missing packages, launches backend (`:5050`) & frontend (`:5173`), and opens your default browser.*

### Option 2: Command Line Startup
Run the following commands from the root directory:
```bash
# Step 1: Install dependencies for both backend and frontend
npm run install:all

# Step 2: Concurrently start backend API and frontend Vite server
npm start
```

### Option 3: Starting Servers Separately

#### Backend Server (`http://localhost:5050`):
```bash
cd backend
npm install
npm run dev
```

#### Frontend Application (`http://localhost:5173`):
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Production Build & Verification

To verify that the application compiles cleanly without warnings or errors:
```cmd
cmd /c "npm run build --prefix frontend"
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Manager authentication |
| `POST` | `/api/auth/register` | Register new manager account |
| `GET` | `/api/auth/me` | Fetch user profile |
| `GET` | `/api/outlets` | Fetch all metro branch outlets |
| `POST` | `/api/outlets` | Create new branch outlet |
| `PUT` | `/api/outlets/:id` | Update outlet details |
| `DELETE` | `/api/outlets/:id` | Delete branch outlet |
| `GET` | `/api/products` | Fetch catalog products (with search/filters) |
| `POST` | `/api/products` | Create product with multi-photo gallery |
| `PUT` | `/api/products/:id` | Update product catalog details |
| `DELETE` | `/api/products/:id` | Delete product item |
| `GET` | `/api/sales` | Fetch all transaction receipts |
| `POST` | `/api/sales` | Process new POS checkout sale |
| `GET` | `/api/sales/analytics` | Aggregate sales analytics & metrics |
| `GET` | `/api/sales/trends` | Day-by-day revenue trends by branch outlet |
| `POST` | `/api/inventory/stock-update` | Restock/update stock quantity for product |

---

## 🔑 Demo Credentials

- **Email**: `manager@metro.com`
- **Password**: `password123`

*Click **"1-Click Demo Login"** on the login modal to instantly load pre-configured metro outlets, product catalog items, stock thresholds, and transaction history.*
