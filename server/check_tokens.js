const { Sequelize } = require("sequelize");
require("dotenv").config();

// Extract instance (if any)
const [host, instanceName] = process.env.DB_HOST.split("\\");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host,
        dialect: "mssql",
        port: Number(process.env.DB_PORT) || 1433,
        logging: false,
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
                instanceName: instanceName || undefined,
            },
        },
    }
);

async function checkTokens() {
    try {
        await sequelize.authenticate();
        console.log("✅ DB Connected");

        const [results] = await sequelize.query("SELECT id, username, refresh_token FROM users");
        console.log(`Found ${results.length} users.`);

        results.forEach(u => {
            console.log(`User: ${u.username} (ID: ${u.id})`);
            if (u.refresh_token) {
                console.log(`  Refresh Token Length: ${u.refresh_token.length}`);
                console.log(`  Refresh Token Preview: ${u.refresh_token.substring(0, 20)}...`);
            } else {
                console.log(`  Refresh Token: NULL`);
            }
        });

    } catch (error) {
        console.error("❌ Error checking tokens:", error);
    } finally {
        process.exit();
    }
}

checkTokens();
