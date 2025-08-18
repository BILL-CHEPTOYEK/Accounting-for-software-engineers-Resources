// /04-Application/backend/models/paymentAllocation.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentAllocation = sequelize.define('PaymentAllocation', {
  payment_allocation_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  payment_id: { // Foreign Key to the Payment record
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'payments',
      key: 'payment_id',
    },
    onDelete: 'CASCADE', // If a Payment is deleted, its allocations are too
  },
  // One of these two foreign keys will be null, depending on if it's an invoice or bill
  invoice_id: { // Foreign Key to the Invoice (if payment received)
    type: DataTypes.UUID,
    allowNull: true, // Can be null if it's a bill allocation
    references: {
      model: 'invoices',
      key: 'invoice_id',
    },
    onDelete: 'SET NULL', // If invoice is deleted, allocation record remains but reference is cleared
  },
  bill_id: { // Foreign Key to the Bill (if payment made)
    type: DataTypes.UUID,
    allowNull: true, // Can be null if it's an invoice allocation
    references: {
      model: 'bills',
      key: 'bill_id',
    },
    onDelete: 'SET NULL', // If bill is deleted, allocation record remains but reference is cleared
  },
  allocated_amount: { // The portion of the payment amount applied to this specific invoice/bill
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  allocation_date: { // Date the allocation was made (could differ from payment date)
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'payment_allocations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['payment_id'],
      name: 'idx_payment_allocation_payment_id',
    },
    {
      fields: ['invoice_id'],
      name: 'idx_payment_allocation_invoice_id',
    },
    {
      fields: ['bill_id'],
      name: 'idx_payment_allocation_bill_id',
    },
  ],
});

module.exports = PaymentAllocation;
