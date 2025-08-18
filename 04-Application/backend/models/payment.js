// /04-Application/backend/models/payment.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  document_no: { // Internal payment reference or external transaction ID
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true, // Each payment should have a unique document number
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  amount: { 
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  payment_method: {
    type: DataTypes.ENUM('Cash', 'Bank Transfer', 'Check', 'Mobile Money', 'Other'),
    allowNull: false,
  },
  type: { // 'Received' (from customer) or 'Made' (to supplier)
    type: DataTypes.ENUM('Received', 'Made'),
    allowNull: false,
  },
  party_id: { // Customer or Supplier who made/received this payment
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'parties',
      key: 'party_id',
    },
  },
  account_id: { // The bank or cash account where payment was received/made
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chart_of_accounts',
      key: 'account_id',
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // This field indicates if the payment has been fully or partially allocated.
  // It can be dynamically updated based on PaymentAllocations.
  // For simplicity, we'll assume 'Applied' or 'Unapplied' based on allocation sum.
  status: {
    type: DataTypes.ENUM('Unapplied', 'Partially Applied', 'Fully Applied', 'Refunded'),
    defaultValue: 'Unapplied',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Payment;
