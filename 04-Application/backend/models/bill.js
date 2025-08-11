// /04-Application/backend/models/bill.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bill = sequelize.define('Bill', {
  bill_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  party_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'parties',
      key: 'party_id',
    },
  },
  bill_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  issue_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Received', 'Paid', 'Cancelled'),
    defaultValue: 'Received',
  },
}, {
  tableName: 'bills',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Bill;