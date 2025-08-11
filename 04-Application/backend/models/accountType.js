// /04-Application/backend/models/accountType.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AccountType = sequelize.define('AccountType', {
  account_type_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
  },
  normal_balance: {
    type: DataTypes.ENUM('DR', 'CR'),
    allowNull: false,
  },
}, {
  tableName: 'account_types',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = AccountType;