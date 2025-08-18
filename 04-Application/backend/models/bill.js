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
  // Fields for payment tracking
  amount_paid: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  outstanding_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00, // Will be total_amount - amount_paid
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Pending Approval', 'Approved', 'Paid', 'Cancelled', 'Partially Paid'), 
    defaultValue: 'Draft',
    allowNull: false,
  },
}, {
  tableName: 'bills', // Explicitly define table name
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // Before saving, ensure outstanding_balance is calculated
    beforeSave: (bill, options) => {
      bill.outstanding_balance = parseFloat(bill.total_amount) - parseFloat(bill.amount_paid);
      // Update status based on payment
      if (bill.outstanding_balance <= 0 && parseFloat(bill.total_amount) > 0 && bill.status !== 'Cancelled') {
        bill.status = 'Paid';
      } else if (bill.amount_paid > 0 && bill.outstanding_balance > 0 && bill.status !== 'Cancelled') {
        bill.status = 'Partially Paid';
      }
    },
    // For existing records, ensure initial outstanding_balance is set correctly
    afterFind: (billsOrBill) => {
      if (Array.isArray(billsOrBill)) {
        billsOrBill.forEach(bill => {
          if (bill && bill.total_amount !== null && bill.amount_paid !== null) {
            bill.outstanding_balance = parseFloat(bill.total_amount) - parseFloat(bill.amount_paid);
          }
        });
      } else if (billsOrBill && billsOrBill.total_amount !== null && billsOrBill.amount_paid !== null) {
        billsOrBill.outstanding_balance = parseFloat(billsOrBill.total_amount) - parseFloat(billsOrBill.amount_paid);
      }
    }
  }
});

module.exports = Bill;
