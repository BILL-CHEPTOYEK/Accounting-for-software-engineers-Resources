// /04-Application/backend/models/chartOfAccount.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChartOfAccount = sequelize.define('ChartOfAccount', {
  account_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  account_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'account_types',
      key: 'account_type_id',
    },
  },
  account_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  parent_id: {
    type: DataTypes.UUID,
    references: {
      model: 'chart_of_accounts',
      key: 'account_id',
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'chart_of_accounts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ChartOfAccount;