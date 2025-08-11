// /04-Application/backend/models/index.js

const sequelize = require('../config/database');
const Party = require('./party');
const Invoice = require('./invoice');
const Bill = require('./bill');

const db = {};

db.sequelize = sequelize;
db.Party = Party;
db.Invoice = Invoice;
db.Bill = Bill;

// Define Associations
// A Party can have many Invoices
db.Party.hasMany(db.Invoice, {
  foreignKey: 'party_id',
  as: 'invoices',
});

// An Invoice belongs to a single Party
db.Invoice.belongsTo(db.Party, {
  foreignKey: 'party_id',
  as: 'customer',
});

// A Party can have many Bills
db.Party.hasMany(db.Bill, {
  foreignKey: 'party_id',
  as: 'bills',
});

// A Bill belongs to a single Party
db.Bill.belongsTo(db.Party, {
  foreignKey: 'party_id',
  as: 'issuer',
});

module.exports = db;