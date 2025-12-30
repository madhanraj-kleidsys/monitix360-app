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
        logging: console.log,
        dialectOptions: {
            options: {
                encrypt: false,
                trustServerCertificate: true,
                instanceName: instanceName || undefined,
            },
        },
    }
);

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log("✅ Connected to DB.");

        const queryInterface = sequelize.getQueryInterface();

        // 1. Add refresh_token to users
        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'refresh_token')
      BEGIN
        ALTER TABLE [dbo].[users] ADD [refresh_token] NVARCHAR(MAX) NULL;
        PRINT 'Added refresh_token to users';
      END
    `);

        // 2. Add new columns to tasks
        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'start_early_reason')
      BEGIN
          ALTER TABLE [dbo].[tasks] ADD [start_early_reason] NVARCHAR(MAX) NULL;
          PRINT 'Added start_early_reason to tasks';
      END
    `);

        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'start_late_reason')
      BEGIN
          ALTER TABLE [dbo].[tasks] ADD [start_late_reason] NVARCHAR(MAX) NULL;
          PRINT 'Added start_late_reason to tasks';
      END
    `);

        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'pause_reason')
      BEGIN
          ALTER TABLE [dbo].[tasks] ADD [pause_reason] NVARCHAR(MAX) NULL;
          PRINT 'Added pause_reason to tasks';
      END
    `);

        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'stop_reason')
      BEGIN
          ALTER TABLE [dbo].[tasks] ADD [stop_reason] NVARCHAR(MAX) NULL;
          PRINT 'Added stop_reason to tasks';
      END
    `);

        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'added_by_user')
      BEGIN
          ALTER TABLE [dbo].[tasks] ADD [added_by_user] BIT DEFAULT 0;
          PRINT 'Added added_by_user to tasks';
      END
    `);

        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND name = 'approval_status')
      BEGIN
          ALTER TABLE [dbo].[tasks] ADD [approval_status] NVARCHAR(255) DEFAULT 'Pending';
          PRINT 'Added approval_status to tasks';
      END
    `);

        await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'expo_push_token')
      BEGIN
          ALTER TABLE [dbo].[users] ADD [expo_push_token] NVARCHAR(MAX) NULL;
          PRINT 'Added expo_push_token to users';
      END
    `);

        console.log("✅ Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
