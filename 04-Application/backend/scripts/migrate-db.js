// /04-Application/backend/scripts/migrate-db.js
// ONLY run this when you need to update database schemas

const db = require('../models');

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Force sync only in development when explicitly needed
    await db.sequelize.sync({ alter: true });
    
    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
