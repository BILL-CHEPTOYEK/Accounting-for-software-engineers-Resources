// /04-Application/backend/models/index.js

const sequelize = require('../config/database');
const Party = require('./party');
const Invoice = require('./invoice');
const Bill = require('./bill');
const AccountType = require('./accountType');
const ChartOfAccount = require('./chartOfAccount');
const Transaction = require('./transaction'); 

const db = {};

db.sequelize = sequelize;
db.Party = Party;
db.Invoice = Invoice;
db.Bill = Bill;
db.AccountType = AccountType;
db.ChartOfAccount = ChartOfAccount;
db.Transaction = Transaction; 

// Define Associations

// Party associations
db.Party.hasMany(db.Invoice, {
  foreignKey: 'party_id',
  as: 'invoices',
});
db.Invoice.belongsTo(db.Party, {
  foreignKey: 'party_id',
  as: 'customer',
});

db.Party.hasMany(db.Bill, {
  foreignKey: 'party_id',
  as: 'bills',
});
db.Bill.belongsTo(db.Party, {
  foreignKey: 'party_id',
  as: 'issuer',
});

// Chart of Accounts associations
db.AccountType.hasMany(db.ChartOfAccount, {
  foreignKey: 'account_type_id',
  as: 'accounts',
});
db.ChartOfAccount.belongsTo(db.AccountType, {
  foreignKey: 'account_type_id',
  as: 'accountType',
});

// Self-referencing association for parent accounts
db.ChartOfAccount.hasMany(db.ChartOfAccount, {
  foreignKey: 'parent_id',
  as: 'childAccounts',
});
db.ChartOfAccount.belongsTo(db.ChartOfAccount, {
  foreignKey: 'parent_id',
  as: 'parentAccount',
});

// Transaction associations
db.ChartOfAccount.hasMany(db.Transaction, {
  foreignKey: 'account_id',
  as: 'transactions',
});
db.Transaction.belongsTo(db.ChartOfAccount, {
  foreignKey: 'account_id',
  as: 'account',
});

// Self-referencing association for transaction reversals
db.Transaction.hasOne(db.Transaction, {
  foreignKey: 'reversal_of_transaction_id',
  as: 'reversedTransaction',
});

module.exports = db;