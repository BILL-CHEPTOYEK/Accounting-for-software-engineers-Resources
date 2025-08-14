// /04-Application/backend/models/billLineItem.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BillLineItem = sequelize.define('BillLineItem', {
  bill_line_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bill_id: { // Foreign Key to the Bill
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bills', // Refers to the 'bills' table
      key: 'bill_id',
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 1.00,
  },
  unit_price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  line_total_amount: { // Quantity * Unit Price
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  // crucial for automated expense/asset posting
  // It allows users to specify which expense/asset account each line item affects.
  account_id: {
    type: DataTypes.UUID,
    allowNull: false, // Each bill line item must be categorized
    references: {
      model: 'chart_of_accounts',
      key: 'account_id',
    },
  },
}, {
  tableName: 'bill_line_items', // Explicitly defines table name
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = BillLineItem;
