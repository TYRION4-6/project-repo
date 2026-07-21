const WebSocket = require("ws");
const salesEmitter = require("./emitter");

const initWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  console.log("WebSocket Server initialized on the main HTTP server");

  wss.on("connection", (ws, req) => {
    console.log("New WebSocket client connected");

    ws.send(JSON.stringify({ type: "CONNECTION_ACK", message: "Connected to MetroOps Live Sales Feed" }));

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Listen for new sales emitted from the backend and broadcast them to all clients
  salesEmitter.on("newSale", (sale) => {
    console.log(`Broadcasting new sale: ${sale._id} for product ${sale.product?.name}`);
    const message = JSON.stringify({
      type: "NEW_SALE",
      data: sale,
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  return wss;
};

module.exports = initWebSocket;
