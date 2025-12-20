require("dotenv").config();
// const { pool, initializeTables } = require("./src/config/db");
const http = require('http'); // Import http module
const app = require("./src/app");

const { sequelize, initializeTables } = require("./src/config/db");
const { initializeSocket } = require("./src/socket/socket"); // Import socket init

const port = process.env.PORT || 3000; // Updated default port to 3000
const HOST = process.env.HOST || "0.0.0.0"; // Listen on all available network interfaces

// Create HTTP server wrapping the Express app
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// ------------------------------------------------------
// 🚀 START SERVER WITH SEQUELIZE + MSSQL
// ------------------------------------------------------
(async () => {
  try {
    await sequelize.authenticate();    // ⬅️ Connect to MSSQL using Sequelize
    console.log("✅ Sequelize connected to MSSQL");

    await initializeTables();          // ⬅️ Sync all models to MSSQL

    // Listen on the HTTP server, not just the Express app
    server.listen(port, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${port}`);
    });
  } catch (err) {
    console.error("❌ Sequelize MSSQL connection error:", err);
  }
})();
