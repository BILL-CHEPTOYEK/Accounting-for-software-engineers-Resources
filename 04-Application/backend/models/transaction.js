// /04-Application/backend/models/transaction.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  transaction_no: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  transaction_type: {
    type: DataTypes.STRING(100),
      allowNull: false,
  },
  account_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chart_of_accounts',
      key: 'account_id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  debit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  credit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  // Reference to source document (e.g., Invoice ID, Bill ID)
  reference_no: {
    type: DataTypes.STRING(255), // Store the ID of the source document
    allowNull: true,
  },
  is_posted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reversal_of_transaction_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'transactions',
      key: 'transaction_id',
    },
  },
  addedby: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id',
    },
  },
  branch_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'branch_id',
    },
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['transaction_no', 'date'],
      name: 'unique_journal_entry_per_day',
    },
    {
      fields: ['reference_no'],
      name: 'idx_transaction_reference_no',
    },
  ],
});

module.exports = Transaction;