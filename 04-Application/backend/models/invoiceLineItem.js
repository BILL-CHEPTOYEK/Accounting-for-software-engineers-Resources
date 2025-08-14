// /04-Application/backend/models/invoiceLineItem.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InvoiceLineItem = sequelize.define('InvoiceLineItem', {
  invoice_line_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoice_id: { // Foreign Key to the Invoice
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'invoices', // Refers to 'invoices' table
      key: 'invoice_id',
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
}, {
  tableName: 'invoice_line_items', // Explicitly define table name
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = InvoiceLineItem;
