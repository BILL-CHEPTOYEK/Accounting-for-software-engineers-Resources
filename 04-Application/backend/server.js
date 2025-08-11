// /04-Application/backend/server.js

const express = require('express');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Main route
app.get('/', (req, res) => {
  res.send('Welcome to the Accounting System API');
});

// Sync database and start server
db.sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synced!');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });