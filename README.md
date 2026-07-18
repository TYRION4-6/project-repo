# Metro Retail Inventory Dashboard

A modern, full-stack retail management and inventory analytics solution. This application features a robust Express.js backend powered by MongoDB and a dynamic React.js frontend built with Vite, Tailwind CSS, Lucide Icons, and Recharts.

---

## 🚀 Project Overview

The **Metro Retail Inventory Dashboard** is designed for multi-branch retail management. It enables store managers and administrators to oversee outlets, manage products, conduct real-time POS (Point of Sale) checkouts, and view live sales analytics.

### Key Features
*   **Authentication & Security**: Secure user registration and login utilizing JSON Web Tokens (JWT) and bcryptjs password hashing.
*   **Outlet Management**: Manage multiple retail branch outlets, including location info and contact details.
*   **Inventory Control**: Comprehensive product tracking with SKU, category, price, stock, and low-stock alerts.
*   **POS (Point of Sale)**: Interactive checkout view for processing sales, updating inventory automatically, and registering transactions.
*   **Analytics Dashboard**: Visual charts depicting sales trends, top-selling items, and outlet performance using Recharts.

---

## 📁 Repository Structure

```text
project-repo/
├── backend/
│   ├── config/          # Database configuration (MongoDB)
│   ├── middleware/      # JWT Authentication & authorization middleware
│   ├── models/          # Mongoose Schemas (User, Outlet, Product, Sale)
│   ├── routes/          # API Route controllers (auth, outlets, products, sales)
│   ├── app.js           # Server entry point
│   └── package.json     # Node.js dependencies & scripts
│
└── frontend/
    ├── src/
    │   ├── components/  # React views (Auth, Dashboard, Inventory, Outlets, POS, Transactions)
    │   ├── api.js       # Fetch-based API client for backend integration
    │   ├── App.jsx      # Main application router and state manager
    │   ├── index.css    # Core styling configurations
    │   └── main.jsx     # Frontend mounting point
    ├── package.json     # Frontend dependencies & scripts
    └── vite.config.js   # Vite configuration
```

---

## 🛠️ Tech Stack

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (via Mongoose ODM)
*   **Auth**: JWT (jsonwebtoken) & bcryptjs
*   **Dev Tools**: Nodemon

### Frontend
*   **Framework**: React (v19)
*   **Build Tool**: Vite
*   **Icons**: Lucide React
*   **Visualization**: Recharts (for dashboards)
*   **Linter**: Oxlint

---

## ⚙️ Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16+ recommended)
*   [MongoDB](https://www.mongodb.com/) (Local service or MongoDB Atlas connection string)

---

### 1. Backend Configuration

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of the `/backend` folder and configure the following variables:
    ```env
    PORT=3000
    MONGO_URI=mongodb://127.0.0.1:27017/metro_retail
    JWT_SECRET=your_super_secret_jwt_key
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The server will start running on `http://localhost:3000`.

---

### 2. Frontend Configuration

1.  Navigate to the `frontend` directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite local development server:
    ```bash
    npm run dev
    ```
    The app will open and run locally (usually on `http://localhost:5173`).

---

## 🔌 API Reference

All backend API endpoints are prefix-based at `/api`. Below are the primary endpoints:

| Endpoint | Method | Authentication | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | None | Register a new user |
| `/api/auth/login` | `POST` | None | Login a user and retrieve a JWT |
| `/api/auth/me` | `GET` | JWT Bearer | Get the profile of the logged-in user |
| `/api/outlets` | `GET` | JWT Bearer | Get all outlets |
| `/api/outlets` | `POST` | JWT Bearer | Create a new retail outlet |
| `/api/outlets/:id` | `PUT` | JWT Bearer | Update an existing outlet's details |
| `/api/outlets/:id` | `DELETE` | JWT Bearer | Delete an outlet |
| `/api/products` | `GET` | JWT Bearer | Retrieve products (supports filters: `outlet`, `category`, `lowStock`) |
| `/api/products` | `POST` | JWT Bearer | Add a new product to inventory |
| `/api/products/:id` | `PUT` | JWT Bearer | Update product details or stock |
| `/api/products/:id` | `DELETE` | JWT Bearer | Remove a product |
| `/api/sales` | `POST` | JWT Bearer | Record a new checkout sale (auto-updates product stock) |
| `/api/sales` | `GET` | JWT Bearer | Retrieve transaction logs |
| `/api/sales/analytics` | `GET` | JWT Bearer | Retrieve sales metrics & chart data |

---

## 🔒 Security & Code Standards

*   **Middleware Authorization**: Routes handling sensitive resources require checking for a valid JWT signature via authorization headers:
    ```text
    Authorization: Bearer <your_jwt_token>
    ```
*   **Database Constraints**: Products feature unique SKU checking per retail branch outlet. Outlets and User records have required unique restraints where appropriate.
*   **Oxlint Guidelines**: The frontend is integrated with Oxlint checking for lightning-fast JS syntax scanning.