// /04-Application/backend/models/index.js

const sequelize = require('../config/database');
const Party = require('./party');
const Invoice = require('./invoice');

const db = {};

db.sequelize = sequelize;
db.Party = Party;
db.Invoice = Invoice;

// Define Associations
// A Party can have many Invoices
db.Party.hasMany(db.Invoice, {
  foreignKey: 'party_id',
  as: 'invoices',
});

// An Invoice belongs to a single Party
db.Invoice.belongsTo(db.Party, {
  foreignKey: 'party_id',
  as: 'customer', // Using customer as the alias for clarity
});

module.exports = db;