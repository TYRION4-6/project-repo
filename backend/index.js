const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database with default data if it doesn't exist
function initDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (data.outlets && data.products) {
        return;
      }
    } catch (e) {
      console.error('Error reading DB, re-initializing...', e);
    }
  }

  const defaultOutlets = [
    { id: 'outlet-1', name: 'Downtown Flagship', location: '100 Broadway St, Center City' },
    { id: 'outlet-2', name: 'Metro Galleria', location: 'Level 2, Metro Shopping Mall' },
    { id: 'outlet-3', name: 'Westside Plaza', location: '450 West Ave, West District' },
    { id: 'outlet-4', name: 'Northside Hub', location: '12 Logistics Way, North Industrial' },
  ];

  const defaultProducts = [
    // Outlet 1 Products (Electronics & Accessories)
    { id: 'prod-1', name: 'Pro Wireless Mouse', sku: 'TECH-MS-001', price: 29.99, stock: 120, category: 'Electronics', outletId: 'outlet-1', description: 'Ergonomic 2.4GHz wireless mouse with adjustable DPI.' },
    { id: 'prod-2', name: 'Mechanical Keyboard', sku: 'TECH-KB-002', price: 89.99, stock: 45, category: 'Electronics', outletId: 'outlet-1', description: 'RGB backlit mechanical keyboard with blue switches.' },
    { id: 'prod-3', name: 'Noise-Cancelling Headphones', sku: 'TECH-HP-003', price: 149.99, stock: 30, category: 'Electronics', outletId: 'outlet-1', description: 'Active noise-cancelling over-ear headphones with 30h battery life.' },
    { id: 'prod-4', name: 'USB-C Hub Multi-port', sku: 'TECH-HB-004', price: 24.50, stock: 85, category: 'Electronics', outletId: 'outlet-1', description: '6-in-1 USB-C adapter with HDMI, USB 3.0, and SD card reader.' },
    { id: 'prod-5', name: 'Wireless Charging Pad', sku: 'TECH-CP-005', price: 19.99, stock: 150, category: 'Electronics', outletId: 'outlet-1', description: '15W fast wireless charger compatible with Qi-enabled devices.' },
    { id: 'prod-6', name: 'Dual Monitor Stand', sku: 'OFFC-MS-006', price: 49.99, stock: 25, category: 'Office Supplies', outletId: 'outlet-1', description: 'Heavy-duty adjustable dual desk mount for 13-27 inch screens.' },
    { id: 'prod-7', name: 'Ergonomic Office Chair', sku: 'OFFC-CH-007', price: 199.99, stock: 12, category: 'Office Supplies', outletId: 'outlet-1', description: 'Mesh high-back desk chair with lumbar support and 3D armrests.' },
    
    // Outlet 2 Products (Apparel & Accessories)
    { id: 'prod-8', name: 'Classic Leather Jacket', sku: 'APPR-JK-001', price: 129.99, stock: 15, category: 'Apparel', outletId: 'outlet-2', description: 'Genuine leather slim-fit jacket with zipper closure.' },
    { id: 'prod-9', name: 'Runner Pro Sneakers', sku: 'APPR-SN-002', price: 79.95, stock: 60, category: 'Apparel', outletId: 'outlet-2', description: 'Lightweight breathable running shoes with high traction soles.' },
    { id: 'prod-10', name: 'Polarized Sunglasses', sku: 'APPR-SG-003', price: 34.99, stock: 110, category: 'Apparel', outletId: 'outlet-2', description: 'UV400 protection polarized sunglasses for outdoor activities.' },
    { id: 'prod-11', name: 'Canvas Travel Backpack', sku: 'APPR-BP-004', price: 45.00, stock: 40, category: 'Apparel', outletId: 'outlet-2', description: 'Water-resistant vintage canvas backpack with laptop sleeve.' },
    { id: 'prod-12', name: 'Minimalist Slim Wallet', sku: 'APPR-WL-005', price: 25.00, stock: 200, category: 'Apparel', outletId: 'outlet-2', description: 'RFID blocking carbon fiber card holder and money clip.' },
    { id: 'prod-13', name: 'Stainless Steel Watch', sku: 'APPR-WT-006', price: 115.00, stock: 18, category: 'Apparel', outletId: 'outlet-2', description: 'Quartz analog watch with water resistance up to 50 meters.' },

    // Outlet 3 Products (Home & Kitchen)
    { id: 'prod-14', name: 'Chef Knife 8-Inch', sku: 'KTCH-KN-001', price: 39.99, stock: 50, category: 'Home & Kitchen', outletId: 'outlet-3', description: 'High-carbon stainless steel professional kitchen knife.' },
    { id: 'prod-15', name: 'Non-Stick Cookware Set', sku: 'KTCH-CW-002', price: 119.99, stock: 20, category: 'Home & Kitchen', outletId: 'outlet-3', description: '10-piece aluminum nonstick pots and pans set.' },
    { id: 'prod-16', name: 'Electric Coffee Grinder', sku: 'KTCH-CG-003', price: 29.95, stock: 75, category: 'Home & Kitchen', outletId: 'outlet-3', description: 'Stainless steel blades grinder for coffee beans, spices, and herbs.' },
    { id: 'prod-17', name: 'Smart LED Desk Lamp', sku: 'HOME-DL-004', price: 32.50, stock: 90, category: 'Home & Kitchen', outletId: 'outlet-3', description: 'Dimmable table lamp with USB charging port and 5 color modes.' },
    { id: 'prod-18', name: 'Ultrasonic Air Humidifier', sku: 'HOME-HM-005', price: 37.99, stock: 65, category: 'Home & Kitchen', outletId: 'outlet-3', description: '4L cool mist humidifier with auto shut-off for large rooms.' },
    { id: 'prod-19', name: 'Robot Vacuum Cleaner', sku: 'HOME-VC-006', price: 189.99, stock: 10, category: 'Home & Kitchen', outletId: 'outlet-3', description: 'Self-charging robotic vacuum with strong suction for pet hair.' },

    // Outlet 4 Products (Sports & Fitness)
    { id: 'prod-20', name: 'Yoga Mat Non-Slip', sku: 'SPRT-YM-001', price: 22.99, stock: 140, category: 'Sports & Fitness', outletId: 'outlet-4', description: 'Eco-friendly TPE yoga mat with alignment lines.' },
    { id: 'prod-21', name: 'Adjustable Dumbbell Set', sku: 'SPRT-DB-002', price: 249.99, stock: 8, category: 'Sports & Fitness', outletId: 'outlet-4', description: 'Pair of select-a-weight dumbbells, adjustable from 5 to 52.5 lbs.' },
    { id: 'prod-22', name: 'Insulated Water Bottle', sku: 'SPRT-WB-003', price: 18.50, stock: 180, category: 'Sports & Fitness', outletId: 'outlet-4', description: 'Double-walled vacuum insulated stainless steel flask (32 oz).' },
    { id: 'prod-23', name: 'Resistance Bands Set', sku: 'SPRT-RB-004', price: 14.99, stock: 250, category: 'Sports & Fitness', outletId: 'outlet-4', description: '5 exercise tubes with door anchor, handles, and ankle straps.' },
    { id: 'prod-24', name: 'Camping Dome Tent', sku: 'SPRT-TN-005', price: 69.99, stock: 15, category: 'Sports & Fitness', outletId: 'outlet-4', description: '4-person waterproof tent with rainfly and easy setup.' },
    { id: 'prod-25', name: 'LED Headlamp Flashlight', sku: 'SPRT-HL-006', price: 12.99, stock: 130, category: 'Sports & Fitness', outletId: 'outlet-4', description: 'Super bright rechargeable headlamp with motion sensor.' }
  ];

  fs.writeFileSync(DB_FILE, JSON.stringify({ outlets: defaultOutlets, products: defaultProducts }, null, 2), 'utf8');
  console.log('Database initialized with default data.');
}

// Read database from file
function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error('Error reading database, returning empty lists', e);
    return { outlets: [], products: [] };
  }
}

// Write database to file
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing database to file', e);
  }
}

// Initialize database
initDb();

// ----------------- API Endpoints -----------------

// 1. GET Outlets
app.get('/api/outlets', (req, res) => {
  const db = readDb();
  res.json(db.outlets);
});

// 2. GET Products (with search, filtering, pagination)
app.get('/api/products', (req, res) => {
  const db = readDb();
  let { outletId, search, page, limit } = req.query;

  let filteredProducts = [...db.products];

  // A. Filter by outlet
  if (outletId && outletId !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.outletId === outletId);
  }

  // B. Search (name, SKU, category)
  if (search) {
    const query = search.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }

  // Pagination logic
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 8; // Default to 8 items per page
  if (page < 1) page = 1;
  if (limit < 1) limit = 8;

  const total = filteredProducts.length;
  const totalPages = Math.ceil(total / limit) || 1;
  
  if (page > totalPages) {
    page = totalPages;
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Map product outlet names for convenience on frontend
  const productsWithOutletName = paginatedProducts.map(p => {
    const outlet = db.outlets.find(o => o.id === p.outletId);
    return {
      ...p,
      outletName: outlet ? outlet.name : 'Unknown Outlet'
    };
  });

  res.json({
    products: productsWithOutletName,
    total,
    page,
    limit,
    totalPages
  });
});

// Helper for validating product input
function validateProduct(product, isUpdate = false, existingProducts = []) {
  const errors = {};

  if (!product.name || typeof product.name !== 'string' || product.name.trim().length < 3) {
    errors.name = 'Product name is required and must be at least 3 characters.';
  } else if (product.name.trim().length > 100) {
    errors.name = 'Product name cannot exceed 100 characters.';
  }

  const skuPattern = /^[A-Z0-9-]+$/;
  if (!product.sku || typeof product.sku !== 'string' || !skuPattern.test(product.sku.trim())) {
    errors.sku = 'SKU is required and must contain only uppercase letters, numbers, and hyphens (e.g. TECH-MS-001).';
  } else {
    const trimmedSku = product.sku.trim();
    const isSkuTaken = existingProducts.some(p => 
      p.sku.toUpperCase() === trimmedSku.toUpperCase() && (!isUpdate || p.id !== product.id)
    );
    if (isSkuTaken) {
      errors.sku = 'This SKU is already assigned to another product.';
    }
  }

  const price = parseFloat(product.price);
  if (isNaN(price) || price <= 0) {
    errors.price = 'Price is required and must be a positive number greater than 0.';
  }

  const stock = parseInt(product.stock);
  if (isNaN(stock) || stock < 0) {
    errors.stock = 'Stock level is required and must be a non-negative integer (0 or more).';
  }

  if (!product.category || typeof product.category !== 'string' || product.category.trim().length === 0) {
    errors.category = 'Category is required.';
  }

  if (!product.outletId) {
    errors.outletId = 'An outlet must be assigned.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 3. POST Product (Create)
app.post('/api/products', (req, res) => {
  const db = readDb();
  const { name, sku, price, stock, category, outletId, description } = req.body;

  const newProduct = {
    id: 'prod-' + Date.now(),
    name: name ? name.trim() : '',
    sku: sku ? sku.trim().toUpperCase() : '',
    price: parseFloat(price),
    stock: parseInt(stock),
    category: category ? category.trim() : '',
    outletId: outletId || '',
    description: description ? description.trim() : ''
  };

  const validation = validateProduct(newProduct, false, db.products);
  const outletExists = db.outlets.some(o => o.id === newProduct.outletId);
  if (!outletExists) {
    validation.errors.outletId = 'Assigned outlet does not exist.';
    validation.isValid = false;
  }

  if (!validation.isValid) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  db.products.push(newProduct);
  writeDb(db);

  // Return the created product (with outlet name)
  const outlet = db.outlets.find(o => o.id === newProduct.outletId);
  res.status(214).json({
    message: 'Product created successfully',
    product: {
      ...newProduct,
      outletName: outlet ? outlet.name : 'Unknown Outlet'
    }
  });
});

// 4. PUT Product (Update)
app.put('/api/products/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  
  const productIndex = db.products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const { name, sku, price, stock, category, outletId, description } = req.body;
  const originalProduct = db.products[productIndex];

  const updatedProduct = {
    id: originalProduct.id,
    name: name !== undefined ? name.trim() : originalProduct.name,
    sku: sku !== undefined ? sku.trim().toUpperCase() : originalProduct.sku,
    price: price !== undefined ? parseFloat(price) : originalProduct.price,
    stock: stock !== undefined ? parseInt(stock) : originalProduct.stock,
    category: category !== undefined ? category.trim() : originalProduct.category,
    outletId: outletId !== undefined ? outletId : originalProduct.outletId,
    description: description !== undefined ? description.trim() : originalProduct.description
  };

  const validation = validateProduct(updatedProduct, true, db.products);
  const outletExists = db.outlets.some(o => o.id === updatedProduct.outletId);
  if (!outletExists) {
    validation.errors.outletId = 'Assigned outlet does not exist.';
    validation.isValid = false;
  }

  if (!validation.isValid) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.errors
    });
  }

  db.products[productIndex] = updatedProduct;
  writeDb(db);

  // Return the updated product (with outlet name)
  const outlet = db.outlets.find(o => o.id === updatedProduct.outletId);
  res.json({
    message: 'Product updated successfully',
    product: {
      ...updatedProduct,
      outletName: outlet ? outlet.name : 'Unknown Outlet'
    }
  });
});

// 5. DELETE Product
app.delete('/api/products/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;

  const productIndex = db.products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const deletedProduct = db.products.splice(productIndex, 1)[0];
  writeDb(db);

  res.json({
    message: 'Product deleted successfully',
    id: deletedProduct.id
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
