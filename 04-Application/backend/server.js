// /04-Application/backend/server.js

const db = require('./models');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Database Synchronization ---
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully! All tables are up-to-date.');
    // Start your Express server only after the database is synced
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Access your app at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
    process.exit(1); // Exit if database sync fails
  });

const partyRoutes = require('./routes/partyRoutes');
app.use('/api/parties', partyRoutes);

const invoiceRoutes = require('./routes/invoiceRoutes');
app.use('/api/invoices', invoiceRoutes); 
