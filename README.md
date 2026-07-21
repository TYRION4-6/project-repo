# Metro Retail Multi-Branch Inventory Dashboard

Metro Retail is a comprehensive dashboard for branch managers to manage multi-branch outlets, products, inventory cataloging, sales (via POS transaction terminal), and sales analytics history.

---

## 🏗️ Project Architecture

The application is structured into two main sub-projects:

1. **`backend`**: Node.js and Express.js REST API server connecting to MongoDB (Atlas).
2. **`frontend`**: React 19 single-page application built on Vite, styled with modern vanilla CSS featuring dark mode, glassmorphism, responsive grids, and smooth animations.

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (CommonJS modules)
- **Framework**: Express.js
- **Database**: MongoDB via Mongoose
- **Auth**: JSON Web Tokens (JWT) & bcryptjs for password hashing

### Frontend
- **Framework**: React 19 (Hooks: `useState`, `useEffect`, `useCallback`)
- **Bundler**: Vite
- **Icons**: Lucide React
- **Charts**: Recharts
- **Styling**: Vanilla CSS (CSS Variables, keyframe animations, responsive grid design)

---

## 📦 Product Management Screen (Manager Portal)

The newly implemented **Products Screen** enables managers to perform all necessary inventory and cataloging actions. It satisfies all acceptance criteria:

### Key Features
1. **Outlet Filtering**: A dropdown selector allows managers to view products scoped to a specific outlet or view all products across all of their managed outlets.
2. **Paginated Data Table**: Displays product details including:
   - **Name** & **Category**
   - **SKU Code** (monospaced code block)
   - **Price** (formatted in INR)
   - **Stock level** & **Low-stock alert status badge** (In Stock, Low Stock, or Out of Stock)
   - **Actions** (Edit and Delete triggers)
3. **Product Form Actions (Add & Edit)**:
   - Dynamic validation ensures all required fields (Name, SKU, Category, Price, Stock level, Outlet) are filled and within bounds (e.g., non-negative prices and stock levels).
   - Shows real-time, field-specific error messages.
   - Restricts changing the Outlet branch during edits to maintain data integrity.
4. **Delete Confirmation**: A confirmation modal prompts the manager before permanent deletion to prevent accidental data loss.
5. **State Synchronization**:
   - The UI automatically refetches paginated products after any creation, update, or deletion.
   - Dispatches a refresh event to sync other views (e.g. Dashboard metrics, POS checkout catalog) in real-time.
   - Shows feedback using a persistent dynamic Toast notifications container (Success, Warning, Info, Error).

---

## 🔗 Backend API Integration

The Product Management screen integrates directly with the following product endpoints:

| Method | Endpoint | Description | Query Parameters |
|--------|----------|-------------|------------------|
| **GET** | `/api/products` | Retrieve products (supports pagination & filtering) | `page` (number), `limit` (number), `outlet` (string), `category` (string), `lowStock` (`true`/`false`) |
| **GET** | `/api/products/:id` | Get details for a single product | None |
| **POST**| `/api/products` | Add a new product to an outlet | None (Requires `name`, `sku`, `category`, `price`, `stockLevel`, `lowStockAlertThreshold`, `outlet` in body) |
| **PUT** | `/api/products/:id` | Update product details | None (Requires updated fields in body) |
| **DELETE** | `/api/products/:id` | Delete a product | None |

*All calls are authenticated and require a JWT token in the `Authorization` header (`Bearer <token>`).*

---

## 🚀 Running the Application Locally

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm**

### Step 1: Start the Backend Server
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the `.env` file (one has already been configured with a development database):
   ```env
   MONGO_URI=mongodb+srv://cyfer:hakkanoodles@cluster00.gtubtsi.mongodb.net/studentdb?appName=Cluster00
   PORT=3000
   ```
4. Start the server:
   - Using nodemon (development hot reload): `npm run dev`
   - Using node: `npm start` (or `node app.js`)

The backend server will run at `http://localhost:3000`.

### Step 2: Start the Frontend Application
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   - For environments where PowerShell execution policies allow scripts: `npm run dev`
   - Bypassing script policies (Windows): `npx.cmd vite`

The frontend application will be hosted at `http://localhost:5173`. Open this URL in your web browser.

---

## 🧪 Linting & Formatting

To run the linter and verify syntax correctness:
```bash
cd frontend
npx.cmd oxlint
```
