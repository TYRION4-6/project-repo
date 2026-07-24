const mongoose = require("mongoose");
const dns = require("dns");

let isMongoConnected = false;

const connectDB = async () => {
  try {
    // Attempt DNS servers set to resolve SRV record issues on Windows/certain ISPs
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (e) {
      console.log("DNS setServers warning:", e.message);
    }

    if (!process.env.MONGO_URI) {
      console.warn("MONGO_URI not specified. Using in-memory fallback store.");
      return false;
    }

    // Set connection timeout
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log("MongoDB Connected Successfully");
    return true;
  } catch (error) {
    console.error("MongoDB Connection Warning:", error.message);
    console.warn("Continuing with in-memory fallback system if MongoDB is unavailable.");
    isMongoConnected = false;
    return false;
  }
};

const getIsConnected = () => isMongoConnected;

module.exports = { connectDB, getIsConnected };