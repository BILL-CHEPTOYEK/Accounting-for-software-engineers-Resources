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
  payment_method: {
    type: DataTypes.ENUM('Cash', 'Credit', 'Bank Transfer', 'Check', 'Mixed'),
    allowNull: true, // Null until invoice is posted/payment method determined
  },
  is_posted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // True when accounting transactions are created
  },
  status: {
    type: DataTypes.ENUM(
      'Draft',           // Invoice being created/edited
      'Pending',         // Awaiting approval or processing
      'Sent',            // Sent to customer (credit sale)
      'Partially Paid',  // Some payment received
      'Paid',            // Fully paid
      'Overdue',         // Past due date with outstanding balance
      'Cancelled',       // Cancelled invoice
      'Void'             // Voided invoice
    ),
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
      const totalAmount = parseFloat(invoice.total_amount) || 0;
      const amountPaid = parseFloat(invoice.amount_paid) || 0;
      invoice.outstanding_balance = totalAmount - amountPaid;
      
      // Debug logging
      console.log(`Invoice ${invoice.document_no} beforeSave: total=${totalAmount}, paid=${amountPaid}, outstanding=${invoice.outstanding_balance}, currentStatus=${invoice.status}`);
      
      // Update status based on payment - handle floating point precision and comprehensive transitions
      if (invoice.status !== 'Cancelled' && invoice.status !== 'Void') {
        // Use small epsilon for floating point comparison to handle precision issues
        const epsilon = 0.01; // 1 cent tolerance
        
        if (Math.abs(invoice.outstanding_balance) <= epsilon && totalAmount > 0) {
          // Full payment made - set to Paid
          console.log(`Invoice ${invoice.document_no} status changing to: Paid (was ${invoice.status})`);
          invoice.status = 'Paid';
        } else if (amountPaid > epsilon && invoice.outstanding_balance > epsilon) {
          // Partial payment made - set to Partially Paid
          console.log(`Invoice ${invoice.document_no} status changing to: Partially Paid (was ${invoice.status})`);
          invoice.status = 'Partially Paid';
        } else if (invoice.outstanding_balance > epsilon && invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'Draft') {
          // Past due date with outstanding balance - set to Overdue (but not if it's Draft)
          if (invoice.status !== 'Overdue') {
            console.log(`Invoice ${invoice.document_no} status changing to: Overdue (was ${invoice.status})`);
            invoice.status = 'Overdue';
          }
        }
        // If no payment made, status remains as is (Draft, Sent, etc.)
      }
      
      console.log(`Invoice ${invoice.document_no} afterSave: finalStatus=${invoice.status}`);
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