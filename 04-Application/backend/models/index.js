// /04-Application/backend/models/index.js

const sequelize = require('../config/database');
const Party = require('./party');
const Invoice = require('./invoice');
const AccountType = require('./accountType');
const ChartOfAccount = require('./chartOfAccount');
const Transaction = require('./transaction');
const User = require('./user'); 
const Branch = require('./branch'); 

const db = {};

db.sequelize = sequelize;
db.Party = Party;
db.Invoice = Invoice;
db.AccountType = AccountType;
db.ChartOfAccount = ChartOfAccount;
db.Transaction = Transaction;
db.User = User;    
db.Branch = Branch; 

// Define Associations

// Party associations
db.Party.hasMany(db.Invoice, {
  foreignKey: 'party_id',
  as: 'invoices',
});
db.Invoice.belongsTo(db.Party, {
  foreignKey: 'party_id',
  as: 'party',
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
db.Transaction.hasMany(db.Transaction, {
  foreignKey: 'reversal_of_transaction_id',
  as: 'reversingTransactions', // Transactions that reverse THIS transaction
  sourceKey: 'transaction_id',
});


// User and Branch associations for Transaction
db.User.hasMany(db.Transaction, {
  foreignKey: 'addedby',
  as: 'createdTransactions',
});
db.Transaction.belongsTo(db.User, {
  foreignKey: 'addedby',
  as: 'createdBy',
});

db.Branch.hasMany(db.Transaction, {
  foreignKey: 'branch_id',
  as: 'branchTransactions',
});
db.Transaction.belongsTo(db.Branch, {
  foreignKey: 'branch_id',
  as: 'branch',
});


module.exports = db;
