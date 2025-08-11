// /04-Application/backend/db-init.js

const db = require('./models');
const seedData = require('./seeders/seed');

const initializeDatabase = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync models and run seeders
    await db.sequelize.sync({ alter: true });
    console.log('Database schema synced!');
    
    await seedData();
    console.log('Database initialization complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('Unable to connect to the database or initialize:', error);
    process.exit(1);
  }
};

initializeDatabase();