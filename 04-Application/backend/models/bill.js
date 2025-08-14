// /04-Application/backend/models/bill.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bill = sequelize.define('Bill', {
  bill_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  party_id: { // Foreign Key to the Party(supplier)
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'parties', 
      key: 'party_id',
    },
  },
  document_no: { // Supplier's bill number or the internal reference
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true, // Each bill document number should be unique
  },
  issue_date: { 
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  due_date: { 
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total_amount: { // Calculated sum of all bill line items
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending Approval', 'Approved', 'Paid', 'Cancelled'),
    defaultValue: 'Draft',
    allowNull: false,
  },
}, {
  tableName: 'bills', // Explicitly define table name
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Bill;
