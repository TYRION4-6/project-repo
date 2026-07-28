const mongoose = require("mongoose");
const dns = require("dns");
const { initMultiDbConnections, multiDbPlugin, dbURIs } = require("./multiDbSync");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
  console.warn("Could not set custom DNS servers:", err.message);
}

mongoose.plugin(multiDbPlugin);

const connections = {};

const connectDB = async () => {
  initMultiDbConnections();

  const primaryUri = process.env.MONGO_URI || dbURIs.cyfer;
  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`Primary MongoDB Connected: ${conn.connection.host}`);
    connections.primary = conn;
    return conn;
  } catch (error) {
    console.error(`Primary MongoDB Connection Error (${primaryUri}): ${error.message}`);
    console.warn("Attempting fallback connection across team members' MongoDB servers...");

    for (const [person, uri] of Object.entries(dbURIs)) {
      if (uri === primaryUri) continue;
      try {
        console.log(`Connecting to ${person}'s MongoDB server...`);
        const conn = await mongoose.connect(uri);
        console.log(`Connected successfully to ${person}'s MongoDB: ${conn.connection.host}`);
        connections.primary = conn;
        return conn;
      } catch (err) {
        console.error(`Failed connecting to ${person}'s MongoDB: ${err.message}`);
      }
    }

    console.warn("Operating with in-memory fallback state until DB resolves.");
  }
};

connectDB.dbURIs = dbURIs;
connectDB.connections = connections;

module.exports = connectDB;
