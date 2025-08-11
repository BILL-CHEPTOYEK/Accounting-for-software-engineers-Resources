// /04-Application/backend/models/party.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Party = sequelize.define('Party', {
  party_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  party_type: {
    type: DataTypes.ENUM('Customer', 'Supplier', 'Employee', 'Other'),
    allowNull: false,
  },
  contact_info: {
    type: DataTypes.JSONB,
    allowNull: true, // can store phone, email, address, etc.
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'parties',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Party;