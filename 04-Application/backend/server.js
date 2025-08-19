// /04-Application/backend/server.js

const express = require('express');
const cors = require('cors'); 
const db = require('./models'); // Sequelize models
const partyRoutes = require('./routes/partyRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const billRoutes = require('./routes/billRoutes'); 
const accountTypeRoutes = require('./routes/accountTypeRoutes');
const chartOfAccountRoutes = require('./routes/chartOfAccountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const branchRoutes = require('./routes/branchRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON request bodies

// --- CORS Configuration ---
app.use(cors({
  origin: 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Database synchronization and server start
// PRODUCTION MODE: Only authenticate connection, don't alter schemas
db.sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Access your app at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });
db.sequelize.sync({ alter: true }) // `alter: true` will update table schemas if models change
  .then(() => {
    console.log('Database synced successfully! All tables are up-to-date. 🎉');
    // Start your Express server only after the database is synced
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}. 🚀`);
      console.log(`Access your app at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to sync database:', err);
    process.exit(1); 
  });

// --- Define API routes AFTER db synchronization setup ---
app.use('/api/parties', partyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/bills', billRoutes); 
app.use('/api/account-types', accountTypeRoutes);
app.use('/api/chart-of-accounts', chartOfAccountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);


// Basic welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the Accounting System API. API endpoints are ready! 😊');
});
