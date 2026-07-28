const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {}

const dbURIs = {
  cyfer: process.env.MONGO_URI_CYFER || process.env.MONGO_URI || "mongodb+srv://cyfer:hakkanoodles@cluster00.gtubtsi.mongodb.net/studentdb?appName=Cluster00",
  amarjeet: process.env.MONGO_URI_AMARJEET || "mongodb+srv://gabbar8050:Qwerty8050@gabbar.ciopeqn.mongodb.net/collegedb?retryWrites=true&w=majority&appName=Gabbar",
  nikunj: process.env.MONGO_URI_NIKUNJ || "mongodb+srv://harsh_singh:harshsingh@cluster0.et4sswu.mongodb.net/collegedb?retryWrites=true&w=majority&appName=Cluster0",
  rupesh: process.env.MONGO_URI_RUPESH || "mongodb+srv://rohuuu7252_db_user:clyninpq@rupesh.kvjoper.mongodb.net/project?appName=rupesh",
};

const memberConnections = {};

const initMultiDbConnections = () => {
  for (const [person, uri] of Object.entries(dbURIs)) {
    if (!memberConnections[person]) {
      try {
        const conn = mongoose.createConnection(uri);
        conn.on("open", () => {
          console.log(`[Multi-DB Sync] Connected & ready: ${person}'s MongoDB server`);
        });
        conn.on("error", (err) => {
          console.warn(`[Multi-DB Sync] Connection warning for ${person}: ${err.message}`);
        });
        memberConnections[person] = conn;
      } catch (err) {
        console.warn(`[Multi-DB Sync] Could not initiate connection for ${person}: ${err.message}`);
      }
    }
  }
};

const getReadyConnection = async (conn) => {
  if (!conn) return null;
  if (conn.readyState === 1 && conn.db) return conn;
  try {
    if (typeof conn.asPromise === "function") {
      await conn.asPromise();
      return conn.db ? conn : null;
    }
  } catch (err) {}
  return null;
};

const syncSaveToAll = async (collectionName, doc) => {
  if (!doc || !doc._id) return;
  const docObject = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  const syncTasks = Object.entries(memberConnections).map(async ([person, conn]) => {
    try {
      const readyConn = await getReadyConnection(conn);
      if (readyConn && readyConn.db) {
        await readyConn.db.collection(collectionName).updateOne(
          { _id: docObject._id },
          { $set: docObject },
          { upsert: true }
        );
      }
    } catch (err) {}
  });

  await Promise.allSettled(syncTasks);
};

const syncDeleteToAll = async (collectionName, filter) => {
  if (!filter) return;

  const syncTasks = Object.entries(memberConnections).map(async ([person, conn]) => {
    try {
      const readyConn = await getReadyConnection(conn);
      if (readyConn && readyConn.db) {
        await readyConn.db.collection(collectionName).deleteMany(filter);
      }
    } catch (err) {}
  });

  await Promise.allSettled(syncTasks);
};

const multiDbPlugin = function (schema) {
  schema.post("save", function (doc) {
    if (doc && this.constructor && this.constructor.collection) {
      const collectionName = this.constructor.collection.name;
      syncSaveToAll(collectionName, doc);
    }
  });

  schema.post("insertMany", function (docs) {
    if (Array.isArray(docs)) {
      docs.forEach((doc) => {
        const collectionName = doc.constructor && doc.constructor.collection ? doc.constructor.collection.name : null;
        if (collectionName) {
          syncSaveToAll(collectionName, doc);
        }
      });
    }
  });

  schema.post("findOneAndUpdate", function (doc) {
    if (doc && this.model && this.model.collection) {
      const collectionName = this.model.collection.name;
      syncSaveToAll(collectionName, doc);
    }
  });
};

module.exports = {
  dbURIs,
  memberConnections,
  initMultiDbConnections,
  getReadyConnection,
  syncSaveToAll,
  syncDeleteToAll,
  multiDbPlugin,
};
