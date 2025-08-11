// /04-Application/backend/models/index.js

const sequelize = require('../config/database');
const Party = require('./party');

const db = {};

db.sequelize = sequelize;
db.Party = Party;

// Associations


module.exports = db;