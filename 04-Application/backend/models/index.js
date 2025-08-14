// /04-Application/backend/models/index.js

const sequelize = require('../config/database');
const Party = require('./party');
const Invoice = require('./invoice');
const InvoiceLineItem = require('./invoiceLineItem');
const Bill = require('./bill'); 
const BillLineItem = require('./billLineItem'); 
const AccountType = require('./accountType');
const ChartOfAccount = require('./chartOfAccount');
const Transaction = require('./transaction');
const User = require('./user');
const Branch = require('./branch');

const db = {};

db.sequelize = sequelize;
db.Party = Party;
db.Invoice = Invoice;
db.InvoiceLineItem = InvoiceLineItem;
db.Bill = Bill;
db.BillLineItem = BillLineItem;
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

// Invoice to InvoiceLineItem association
db.Invoice.hasMany(db.InvoiceLineItem, {
  foreignKey: 'invoice_id',
  as: 'lineItems', // When you query an Invoice, you can include 'lineItems'
  onDelete: 'CASCADE', // If an Invoice is deleted, its line items are too
});
db.InvoiceLineItem.belongsTo(db.Invoice, {
  foreignKey: 'invoice_id',
  as: 'invoice',
});

// InvoiceLineItem to ChartOfAccount association (for revenue categorization)
db.ChartOfAccount.hasMany(db.InvoiceLineItem, {
  foreignKey: 'account_id',
  as: 'invoiceLineItems', // A chart of account can be associated with many invoice line items
});
db.InvoiceLineItem.belongsTo(db.ChartOfAccount, {
  foreignKey: 'account_id',
  as: 'account', // An invoice line item belongs to one account
});

// Party associations for Purchases (Bills)
db.Party.hasMany(db.Bill, {
  foreignKey: 'party_id',
  as: 'bills', 
  // scope: { party_type: 'Supplier' }, 
});
db.Bill.belongsTo(db.Party, {
  foreignKey: 'party_id',
  as: 'party', 
});

db.Bill.hasMany(db.BillLineItem, {
  foreignKey: 'bill_id',
  as: 'lineItems', 
  onDelete: 'CASCADE', // If a Bill is deleted, its line items are too
});
db.BillLineItem.belongsTo(db.Bill, {
  foreignKey: 'bill_id',
  as: 'bill',
});

// BillLineItem to ChartOfAccount association (for expense/asset categorization)
db.ChartOfAccount.hasMany(db.BillLineItem, {
  foreignKey: 'account_id',
  as: 'billLineItems', // A CoA can be used in many bill line items
});
db.BillLineItem.belongsTo(db.ChartOfAccount, {
  foreignKey: 'account_id',
  as: 'account', // Each bill line item belongs to one CoA account
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
  as: 'reversingTransactions',
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

// User to Branch association
db.Branch.hasMany(db.User, {
  foreignKey: 'branch_id',
  as: 'users',
});
db.User.belongsTo(db.Branch, {
  foreignKey: 'branch_id',
  as: 'branch',
});

module.exports = db;
