// /04-Application/backend/server.js

const db = require('./models');
const express = require('express');
const app = express();
const cors = require('cors');
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// --- Database Synchronization ---
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced successfully! All tables are up-to-date. 🎉');
    // Start your Express server only after the database is synced
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}. 🚀`);
      console.log(`Access your app at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
    process.exit(1); // Exit if database sync fails
  });

// --- Define API routes AFTER db synchronization setup ---

const partyRoutes = require('./routes/partyRoutes');
app.use('/api/parties', partyRoutes);

const invoiceRoutes = require('./routes/invoiceRoutes');
app.use('/api/invoices', invoiceRoutes);

const accountTypeRoutes = require('./routes/accountTypeRoutes');
app.use('/api/account-types', accountTypeRoutes);

const chartOfAccountRoutes = require('./routes/chartOfAccountRoutes');
app.use('/api/chart-of-accounts', chartOfAccountRoutes);

const branchRoutes = require('./routes/branchRoutes');
app.use('/api/branches', branchRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const transactionRoutes = require('./routes/transactionRoutes');
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Accounting System API. API endpoints are ready! 😊');
});
