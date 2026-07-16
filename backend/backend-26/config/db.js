const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  try {
    // Set DNS servers to resolve querySrv ECONNREFUSED issues on certain networks
    dns.setServers(["8.8.8.8", "1.1.1.1"]);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;