// /04-Application/backend/config/sequelize.js

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
        ca: fs.readFileSync(path.join(__dirname, 'ca.pem')).toString()
      },
    },
  },
};