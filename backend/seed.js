const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Outlet = require("./models/Outlet");
const Product = require("./models/Product");
const Sale = require("./models/Sale");

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected for seeding...");

    // Clear existing data
    await User.deleteMany({});
    await Outlet.deleteMany({});
    await Product.deleteMany({});
    await Sale.deleteMany({});
    console.log("Existing data cleared.");

    // 1. Create a Manager
    const manager = await User.create({
      name: "Metro Manager",
      email: "manager@metro.com",
      password: "password123",
      role: "manager",
    });
    console.log("Manager seeded:", manager.email);

    // 2. Create Outlets
    const outletsData = [
      { name: "Metro Hub Bandra", city: "Mumbai", address: "Linking Road, Bandra West", phone: "+91 22 26401234" },
      { name: "Connaught Place Store", city: "Delhi", address: "Block E, Connaught Place", phone: "+91 11 41505678" },
      { name: "Indiranagar Tech-Mart", city: "Bangalore", address: "100 Feet Road, Indiranagar", phone: "+91 80 49123456" },
      { name: "Park Street Boutique", city: "Kolkata", address: "Park Street, Near Flurys", phone: "+91 33 22299876" },
      { name: "T-Nagar Fashion Galleria", city: "Chennai", address: "G N Chetty Road, T-Nagar", phone: "+91 44 28154321" },
    ];

    const outlets = await Outlet.insertMany(outletsData);
    console.log(`${outlets.length} outlets seeded.`);

    // 3. Create Products for each Outlet
    const productCategories = [
      { name: "Premium Laptop", category: "Electronics", price: 75000, skuPrefix: "LAP" },
      { name: "Wireless Earbuds", category: "Electronics", price: 2999, skuPrefix: "EAR" },
      { name: "Smartphone 5G", category: "Electronics", price: 24999, skuPrefix: "PHN" },
      { name: "Designer Denim Jeans", category: "Apparel", price: 3499, skuPrefix: "JNS" },
      { name: "Slim Fit Cotton Shirt", category: "Apparel", price: 1899, skuPrefix: "SRT" },
      { name: "Organic Espresso Beans", category: "Groceries", price: 850, skuPrefix: "COF" },
      { name: "Ergonomic Office Chair", category: "Furniture", price: 12500, skuPrefix: "CHR" },
      { name: "Smart LED Light Bulb", category: "Home Appliances", price: 999, skuPrefix: "BLB" },
    ];

    const products = [];
    for (const outlet of outlets) {
      for (const cat of productCategories) {
        // Generate stock (some low stock for demonstration, e.g., Indiranagar has low laptops)
        let stock = Math.floor(Math.random() * 50) + 5; // 5 to 54
        if (cat.skuPrefix === "LAP" && Math.random() > 0.5) {
          stock = Math.floor(Math.random() * 5) + 2; // Low stock: 2-6
        }

        const p = await Product.create({
          name: `${outlet.city} ${cat.name}`,
          sku: `${cat.skuPrefix}-${outlet.city.substring(0,3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          category: cat.category,
          price: cat.price,
          stock: stock,
          outlet: outlet._id,
        });
        products.push(p);
      }
    }
    console.log(`${products.length} products seeded across outlets.`);

    // 4. Create Sales for the past 7 days
    const sales = [];
    const now = new Date();
    
    // Create random sales
    for (let i = 0; i < 60; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomOutletId = randomProduct.outlet;
      
      // Select a date between now and 7 days ago
      const saleDate = new Date();
      saleDate.setDate(now.getDate() - Math.floor(Math.random() * 7));
      // Give it a random hour
      saleDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      const quantity = Math.floor(Math.random() * 4) + 1; // 1 to 4 items
      const totalAmount = randomProduct.price * quantity;

      // Adjust product stock to reflect sales
      if (randomProduct.stock > quantity) {
        randomProduct.stock -= quantity;
        await randomProduct.save();
      }

      sales.push({
        product: randomProduct._id,
        outlet: randomOutletId,
        quantity,
        totalAmount,
        date: saleDate,
      });
    }

    await Sale.insertMany(sales);
    console.log(`${sales.length} sales records seeded.`);

    console.log("Seeding complete! Closing DB connection.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
