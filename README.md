# MetroStock — Realtime Analytics & Multi-Branch Inventory System

A comprehensive, full-stack retail management system designed for multi-branch store operations, real-time point-of-sale (POS) processing, centralized inventory tracking, automated low-stock alerts, and interactive analytics dashboards.

---

## 🚀 Key Features

* 📊 **Analytics Dashboard**
  * Real-time revenue and sales performance tracking across branches.
  * Interactive charts powered by **Recharts** displaying sales trends, top-selling items, and revenue breakdown per outlet.
* 🏬 **Branch Outlets Management**
  * Centralized management of store locations, manager assignments, and operational statuses.
  * Multi-outlet inventory allocation and branch-level tracking.
* 📦 **Product Catalog & Stock Management**
  * Product inventory tracking with custom SKUs, categories, pricing, and reorder levels.
  * Per-branch stock control with instant update capabilities.
* 🛒 **Point of Sale (POS) Terminal**
  * Streamlined retail transaction processing with multi-item cart management.
  * Custom tax and discount calculations.
  * Support for multiple payment methods (Cash, Card, Digital Wallet).
  * Automated real-time stock deduction upon sale completion.
* 📜 **Sales Audit Log**
  * Complete historical transaction records with outlet filtering, date range sorting, and itemized receipts.
* 🚨 **Inventory Alerting System**
  * Automated low-stock and out-of-stock monitoring.
  * Quick-reorder actions and stock replenishment triggers.
* 🔒 **Authentication & User Roles**
  * JWT-backed authentication supporting admin and manager access.
* 🌱 **One-Click Seed Data**
  * Built-in demo data generator to populate multi-outlet retail data for quick setup and testing.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React 19 (via Vite)
* **Charts & Analytics:** Recharts
* **Icons:** Lucide React
* **Styling:** Custom CSS3 with dynamic responsive layouts
* **Linter:** Oxlint

### **Backend**
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB with Mongoose ODM
* **Authentication:** JSON Web Tokens (JWT) & bcryptjs
* **Utilities:** CORS, Dotenv, Cookie-Parser, Morgan

---

## 📁 Project Structure

```
project/
├── backend/                  # Node.js / Express Backend REST API
│   ├── bin/                  # HTTP Server listener setup (www)
│   ├── config/               # Database connection & seed definitions
│   ├── middleware/           # Authentication & request validation middleware
│   ├── models/               # Mongoose schemas (User, Product, Outlet, Inventory, Sale)
│   ├── routes/               # API route definitions (auth, outlets, products, inventory, sales, seed)
│   ├── app.js                # Express app setup and middleware configuration
│   └── package.json          # Backend dependencies and scripts
│
└── frontend/                 # React + Vite Frontend Application
    ├── src/
    │   ├── components/       # UI Components (Analytics, Outlets, Products, POS, Sales, Alerts, Auth)
    │   ├── api.js            # API client service layer
    │   ├── App.jsx           # Master application component & navigation layout
    │   ├── App.css           # Custom UI styling
    │   └── main.jsx          # Application entry point
    ├── package.json          # Frontend dependencies and scripts
    └── vite.config.js        # Vite configuration
```

---

## ⚙️ Getting Started

### **Prerequisites**
* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [npm](https://www.npmjs.com/)
* [MongoDB](https://www.mongodb.com/) (Atlas database cluster or local instance)

---

### 1️⃣ **Backend Setup**

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create or verify the `.env` file inside the `backend` directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   PORT=5050
   JWT_SECRET=your_jwt_secret_key
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   The backend API service will start on `http://localhost:5050`.

---

### 2️⃣ **Frontend Setup**

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   The Vite dev server will typically run at `http://localhost:5173`.

---

## 📡 API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check endpoint returning server status |
| `/api/auth/login` | `POST` | User authentication & JWT generation |
| `/api/auth/profile` | `GET` | Retrieve logged-in user profile |
| `/api/outlets` | `GET`, `POST` | Fetch or create branch outlets |
| `/api/products` | `GET`, `POST` | Fetch catalog products and stock levels |
| `/api/inventory` | `GET`, `PUT` | Manage stock levels & low-stock alerts |
| `/api/sales` | `GET`, `POST` | Record POS sale transactions and retrieve audit log |
| `/api/seed` | `POST` | Populate multi-branch demo data |

---

## 💡 Quick Demo Tip

Once both servers are running:
1. Open `http://localhost:5173` in your browser.
2. Click **"Seed Demo Data"** in the top navigation bar to instantly populate sample stores, products, inventory counts, and sale records.
3. Explore the **Analytics Dashboard**, **POS Terminal**, and **Inventory Alerts**.

---

## 📄 License

This project is licensed under the MIT License.
