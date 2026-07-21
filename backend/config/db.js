const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collegedb";

    // If using an Atlas SRV connection string, set public DNS servers to resolve SRV records
    if (uri.startsWith("mongodb+srv")) {
        try {
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
        } catch (err) {
            console.warn("Could not set custom DNS servers:", err.message);
        }
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        console.log("MongoDB Connected Successfully");
    } catch (err) {
        console.error("Database Connection Error:", err.message);
        console.error("Install and start MongoDB locally, or use a valid Atlas connection string.");
    }
};

module.exports = connectDB;