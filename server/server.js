require("dotenv").config();
// const { pool, initializeTables } = require("./src/config/db");
const app = require("./src/app");

const { sequelize,initializeTables } = require("./src/config/db"); 

const port = process.env.PORT || 5000;
const HOST = process.env.HOST || "localhost";
// ------------------------------------------------------
// 🚀 START SERVER WITH SEQUELIZE + MSSQL
// ------------------------------------------------------
(async () => {
  try {
    await sequelize.authenticate();    // ⬅️ Connect to MSSQL using Sequelize
    console.log("✅ Sequelize connected to MSSQL");

    await initializeTables();          // ⬅️ Sync all models to MSSQL

    app.listen(port, () => {
      console.log(`🚀 Server running on http://${HOST}:${port}`);
    });
  } catch (err) {
    console.error("❌ Sequelize MSSQL connection error:", err);
  }
})();
