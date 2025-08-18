// /04-Application/backend/models/invoice.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  invoice_id: {
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
  type: {
    type: DataTypes.ENUM('Pro forma', 'Commercial', 'Quotation'),
    allowNull: false,
  },
  document_no: {
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
  // payment tracking
  amount_paid: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  outstanding_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00, // total_amount - amount_paid
  },
  status: {
    type: DataTypes.ENUM('Draft', 'Received', 'Sent', 'Paid', 'Cancelled', 'Posted_Cash_Sale', 'Posted_Credit_Sale', 'Partially Paid'), // Added 'Partially Paid'
    defaultValue: 'Draft',
  },
}, {
  tableName: 'invoices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // Before saving, ensure outstanding_balance is calculated
    beforeSave: (invoice, options) => {
      invoice.outstanding_balance = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid);
      // Update status based on payment
      if (invoice.outstanding_balance <= 0 && parseFloat(invoice.total_amount) > 0 && invoice.status !== 'Cancelled') {
        invoice.status = 'Paid';
      } else if (invoice.amount_paid > 0 && invoice.outstanding_balance > 0 && invoice.status !== 'Cancelled') {
        invoice.status = 'Partially Paid';
      }
    },
    // For existing records, ensure initial outstanding_balance is set correctly
    afterFind: (invoicesOrInvoice) => {
      if (Array.isArray(invoicesOrInvoice)) {
        invoicesOrInvoice.forEach(invoice => {
          if (invoice && invoice.total_amount !== null && invoice.amount_paid !== null) {
            invoice.outstanding_balance = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid);
          }
        });
      } else if (invoicesOrInvoice && invoicesOrInvoice.total_amount !== null && invoicesOrInvoice.amount_paid !== null) {
        invoicesOrInvoice.outstanding_balance = parseFloat(invoicesOrInvoice.total_amount) - parseFloat(invoicesOrInvoice.amount_paid);
      }
    }
  }
});

module.exports = Invoice;