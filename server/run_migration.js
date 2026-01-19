const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/db');

async function runMigrations() {
    try {
        console.log('🔌 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        const sqlPath = path.join(__dirname, 'src', 'config', 'mssql_migrations.sql');
        console.log(`📖 Reading migration file: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            console.error('❌ Migration file not found!');
            process.exit(1);
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by 'GO' because 'GO' is a batch separator in SSMS but not valid in single T-SQL statements via drivers
        // We use a regex to match GO on its own line, case-insensitive
        const batches = sqlContent.split(/^\s*GO\s*$/mi);

        console.log(`🚀 Found ${batches.length} batches to execute.`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i].trim();
            if (!batch) continue;

            console.log(`\n--- Executing Batch ${i + 1} ---`);
            // console.log(batch); // Optional: print sql

            try {
                await sequelize.query(batch);
                console.log(`✅ Batch ${i + 1} success.`);
            } catch (err) {
                console.error(`❌ Batch ${i + 1} failed:`, err.message);
                // We might want to continue or stop depending on severity. 
                // For now, we stop to be safe.
                throw err;
            }
        }

        console.log('\n✨ All migrations finished successfully.');
        process.exit(0);

    } catch (error) {
        console.error('\n💥 Migration execution failed:', error);
        process.exit(1);
    }
}

runMigrations();
