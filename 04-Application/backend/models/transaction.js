// /04-Application/backend/models/transaction.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  account_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chart_of_accounts',
      key: 'account_id',
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
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
  reference_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  is_posted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  reversal_of_transaction_id: {
    type: DataTypes.UUID,
    references: {
      model: 'transactions',
      key: 'transaction_id',
    },
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Transaction;