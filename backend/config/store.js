const mongoose = require("mongoose");
const User = require("../models/User");
const Outlet = require("../models/Outlet");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Sale = require("../models/Sale");

// In-Memory Storage Fallback
let inMemoryStore = {
  users: [],
  outlets: [],
  products: [],
  inventories: [],
  sales: [],
};

const isDbReady = () => mongoose.connection.readyState === 1;

// Helper ID Generator for In-Memory
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

// --- SEED INITIAL DEMO DATA ---
const seedInitialData = async () => {
  const rawOutlets = [
    { name: "Metro Retail - Bandra West", code: "MUM-BD1", city: "Mumbai", locality: "Hill Road, Bandra West", contactNumber: "+91 98200 11223", status: "Active", managerId: "mgr_1" },
    { name: "Metro Retail - Connaught Place", code: "DEL-CP1", city: "Delhi", locality: "Inner Circle, Connaught Place", contactNumber: "+91 98111 44556", status: "Active", managerId: "mgr_1" },
    { name: "Metro Retail - Indiranagar", code: "BLR-IND1", city: "Bengaluru", locality: "100ft Road, Indiranagar", contactNumber: "+91 98450 77889", status: "Active", managerId: "mgr_1" },
    { name: "Metro Retail - HITECH City", code: "HYD-HTC1", city: "Hyderabad", locality: "Cyber Towers, HITECH City", contactNumber: "+91 98490 33445", status: "Active", managerId: "mgr_1" },
    { name: "Metro Retail - Koregaon Park", code: "PUN-KP1", city: "Pune", locality: "North Main Road, Koregaon Park", contactNumber: "+91 98220 55667", status: "Active", managerId: "mgr_1" },
  ];

  const rawProducts = [
    { name: "Wireless Noise-Canceling Headphones", sku: "ELE-AUDIO-001", category: "Electronics", price: 7999, costPrice: 4800, unit: "pcs", minStockThreshold: 15, description: "Premium over-ear wireless audio headset", managerId: "mgr_1" },
    { name: "Smart Fitness Watch Ultra", sku: "ELE-SMW-002", category: "Electronics", price: 4499, costPrice: 2500, unit: "pcs", minStockThreshold: 20, description: "AMOLED screen with heart-rate & GPS tracking", managerId: "mgr_1" },
    { name: "Organic Arabica Espresso Beans 1kg", sku: "GRO-BEV-003", category: "Groceries", price: 1299, costPrice: 650, unit: "kg", minStockThreshold: 30, description: "Single-origin roasted coffee beans from Coorg", managerId: "mgr_1" },
    { name: "Cotton Slim-Fit Oxford Shirt", sku: "APP-SHIRT-004", category: "Apparel", price: 1999, costPrice: 900, unit: "pcs", minStockThreshold: 25, description: "100% breathable Egyptian cotton formal shirt", managerId: "mgr_1" },
    { name: "Stainless Steel Smart Flask 750ml", sku: "HOM-KIT-005", category: "Home & Kitchen", price: 899, costPrice: 380, unit: "pcs", minStockThreshold: 12, description: "24-hr temperature control with LED temp display", managerId: "mgr_1" },
    { name: "Herbal Hydrating Skin Serum 50ml", sku: "PER-CARE-006", category: "Personal Care", price: 1499, costPrice: 500, unit: "pcs", minStockThreshold: 18, description: "Hyaluronic acid and vitamin C boosting facial serum", managerId: "mgr_1" },
    { name: "Ergonomic Mesh Office Chair", sku: "FURN-OFF-007", category: "Furniture", price: 8999, costPrice: 5200, unit: "pcs", minStockThreshold: 8, description: "Lumbar support adjustable executive swivel chair", managerId: "mgr_1" },
  ];

  if (isDbReady()) {
    try {
      const count = await Outlet.countDocuments();
      if (count === 0) {
        const createdOutlets = await Outlet.insertMany(rawOutlets);
        const createdProducts = await Product.insertMany(rawProducts);

        // Inventories
        const createdInventories = [];
        createdOutlets.forEach((out, oIdx) => {
          createdProducts.forEach((prod, pIdx) => {
            let qty = 35;
            if ((oIdx + pIdx) % 3 === 0) qty = 8; // Low stock trigger for demo
            if ((oIdx + pIdx) % 5 === 0) qty = 3; // Critical low stock

            createdInventories.push({
              outletId: out._id.toString(),
              productId: prod._id.toString(),
              stockQuantity: qty,
              reorderPoint: prod.minStockThreshold || 10,
            });
          });
        });
        await Inventory.insertMany(createdInventories);

        // Sales history
        const now = new Date();
        const createdSales = [];
        [0, 1, 2, 3, 4, 5, 6].forEach((dayOffset) => {
          const saleDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
          createdOutlets.forEach((out, idx) => {
            const prod1 = createdProducts[idx % createdProducts.length];
            const prod2 = createdProducts[(idx + 2) % createdProducts.length];

            const item1Qty = 2;
            const item2Qty = 1;
            const sub1 = prod1.price * item1Qty;
            const sub2 = prod2.price * item2Qty;

            createdSales.push({
              saleNumber: `TXN-${1000 + dayOffset * 5 + idx}`,
              outletId: out._id.toString(),
              outletName: out.name,
              items: [
                { productId: prod1._id.toString(), productName: prod1.name, quantity: item1Qty, unitPrice: prod1.price, subtotal: sub1 },
                { productId: prod2._id.toString(), productName: prod2.name, quantity: item2Qty, unitPrice: prod2.price, subtotal: sub2 },
              ],
              totalAmount: sub1 + sub2,
              paymentMethod: idx % 2 === 0 ? "UPI" : "Card",
              customerPhone: "+91 98765 43210",
              saleDate: saleDate,
              managerId: "mgr_1",
            });
          });
        });

        await Sale.insertMany(createdSales);
        console.log("MongoDB Seeded successfully with multi-branch demo data!");
      }
    } catch (err) {
      console.warn("Mongoose Seed error:", err.message);
    }
  }

  // Populate In-memory store fallback
  const memOutlets = rawOutlets.map((o, idx) => ({ ...o, _id: `out_${idx + 1}` }));
  const memProducts = rawProducts.map((p, idx) => ({ ...p, _id: `prod_${idx + 1}` }));

  const memInventories = [];
  memOutlets.forEach((out, oIdx) => {
    memProducts.forEach((prod, pIdx) => {
      let qty = 35;
      if ((oIdx + pIdx) % 3 === 0) qty = 8;
      if ((oIdx + pIdx) % 5 === 0) qty = 3;

      memInventories.push({
        _id: `inv_${oIdx}_${pIdx}`,
        outletId: out._id,
        productId: prod._id,
        stockQuantity: qty,
        reorderPoint: prod.minStockThreshold || 10,
        lastRestocked: new Date(),
      });
    });
  });

  const memSales = [];
  const now = new Date();
  [0, 1, 2, 3, 4, 5, 6].forEach((dayOffset) => {
    const saleDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    memOutlets.forEach((out, idx) => {
      const prod1 = memProducts[idx % memProducts.length];
      const prod2 = memProducts[(idx + 2) % memProducts.length];

      const item1Qty = 2;
      const item2Qty = 1;
      const sub1 = prod1.price * item1Qty;
      const sub2 = prod2.price * item2Qty;

      memSales.push({
        _id: `sale_${dayOffset}_${idx}`,
        saleNumber: `TXN-${1000 + dayOffset * 5 + idx}`,
        outletId: out._id,
        outletName: out.name,
        items: [
          { productId: prod1._id, productName: prod1.name, quantity: item1Qty, unitPrice: prod1.price, subtotal: sub1 },
          { productId: prod2._id, productName: prod2.name, quantity: item2Qty, unitPrice: prod2.price, subtotal: sub2 },
        ],
        totalAmount: sub1 + sub2,
        paymentMethod: idx % 2 === 0 ? "UPI" : "Card",
        customerPhone: "+91 98765 43210",
        saleDate: saleDate,
        managerId: "mgr_1",
      });
    });
  });

  inMemoryStore.outlets = memOutlets;
  inMemoryStore.products = memProducts;
  inMemoryStore.inventories = memInventories;
  inMemoryStore.sales = memSales;

  if (inMemoryStore.users.length === 0) {
    inMemoryStore.users.push({
      _id: "mgr_1",
      name: "Rajesh Kumar",
      email: "manager@metroretail.com",
      password: "$2a$10$YourHashedPasswordHere",
      businessName: "MetroRetail Group",
      city: "Mumbai",
      role: "Manager",
      createdAt: new Date(),
    });
  }
};

module.exports = {
  isDbReady,
  inMemoryStore,
  generateId,
  seedInitialData,
};
