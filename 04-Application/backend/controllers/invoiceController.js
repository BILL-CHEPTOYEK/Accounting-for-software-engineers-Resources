// /04-Application/backend/controllers/invoiceController.js

const db = require('../models');
const Invoice = db.Invoice;
const InvoiceLineItem = db.InvoiceLineItem;
const Transaction = db.Transaction;
const ChartOfAccount = db.ChartOfAccount;
const User = db.User;
const Branch = db.Branch;
const Payment = db.Payment; // NEW: Import Payment model
const PaymentAllocation = db.PaymentAllocation; // Import PaymentAllocation model
const { Op } = require('sequelize'); // Import Op for queries

// Helper function to find a ChartOfAccount by its name (or by specific attributes if name isn't unique enough)
const findAccountByName = async (accountName, transaction) => {
  const account = await ChartOfAccount.findOne({
    where: { name: accountName },
    transaction,
  });
  if (!account) {
    throw new Error(`Required account '${accountName}' not found in Chart of Accounts.`);
  }
  return account;
};

// Get all invoices, including their line items and associated party
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { model: db.Party, as: 'party' },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          include: [{ model: ChartOfAccount, as: 'account' }]
        },
        // Include PaymentAllocations to help calculate true outstanding balance
        {
          model: db.PaymentAllocation,
          as: 'paymentAllocations',
          include: [{ model: db.Payment, as: 'payment' }]
        }
      ],
      order: [['issue_date', 'DESC']],
    });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error in getAllInvoices:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single invoice by ID, including its line items and associated party
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.invoice_id, {
      include: [
        { model: db.Party, as: 'party' },
        {
          model: InvoiceLineItem,
          as: 'lineItems',
          include: [{ model: ChartOfAccount, as: 'account' }]
        },
        // Include PaymentAllocations to help calculate true outstanding balance
        {
          model: db.PaymentAllocation,
          as: 'paymentAllocations',
          include: [{ model: db.Payment, as: 'payment' }]
        }
      ]
    });
    if (invoice) {
      res.status(200).json(invoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Create a new invoice with nested line items
exports.createInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { lineItems, ...invoiceData } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Invoice must have at least one line item.' });
    }

    for (const item of lineItems) {
      if (!item.account_id) {
        await t.rollback();
        return res.status(400).json({ error: 'Each invoice line item must have an associated account (account_id).' });
      }
      const existingAccount = await ChartOfAccount.findByPk(item.account_id, { transaction: t });
      if (!existingAccount) {
        await t.rollback();
        return res.status(400).json({ error: `Invalid account_id: ${item.account_id} found in line items.` });
      }
    }

    let calculatedTotalAmount = lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const lineTotal = quantity * unitPrice;
      item.line_total_amount = lineTotal.toFixed(2);
      return sum + lineTotal;
    }, 0);

    invoiceData.total_amount = calculatedTotalAmount.toFixed(2);
    // Initialize amount_paid and outstanding_balance for new invoices
    invoiceData.amount_paid = 0.00;
    invoiceData.outstanding_balance = parseFloat(invoiceData.total_amount);


    const newInvoice = await Invoice.create(invoiceData, { transaction: t });

    const newLineItems = lineItems.map(item => ({
      ...item,
      invoice_id: newInvoice.invoice_id
    }));
    await InvoiceLineItem.bulkCreate(newLineItems, { transaction: t });

    await t.commit();
    const createdInvoiceWithLines = await Invoice.findByPk(newInvoice.invoice_id, {
      include: [{ model: InvoiceLineItem, as: 'lineItems', include: [{ model: ChartOfAccount, as: 'account' }] }, { model: db.Party, as: 'party' }]
    });
    res.status(201).json(createdInvoiceWithLines);
  } catch (error) {
    await t.rollback();
    console.error('Error in createInvoice:', error);
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Update an invoice by ID, including its line items
exports.updateInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const invoice_id = req.params.invoice_id;
    const { lineItems, ...invoiceData } = req.body;

    const existingInvoice = await Invoice.findByPk(invoice_id, { transaction: t });

    if (!existingInvoice) {
      await t.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (existingInvoice.status.startsWith('Posted_') || existingInvoice.status === 'Paid' || existingInvoice.status === 'Partially Paid') {
      await t.rollback();
      return res.status(403).json({ error: `Cannot update a ${existingInvoice.status} invoice. Create a new invoice or a credit note instead.` });
    }

    if (lineItems && Array.isArray(lineItems)) {
      if (lineItems.length === 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Invoice must have at least one line item.' });
      }

      for (const item of lineItems) {
        if (!item.account_id) {
          await t.rollback();
          return res.status(400).json({ error: 'Each invoice line item must have an associated account (account_id).' });
        }
        const existingAccount = await ChartOfAccount.findByPk(item.account_id, { transaction: t });
        if (!existingAccount) {
          await t.rollback();
          return res.status(400).json({ error: `Invalid account_id: ${item.account_id} found in line items.` });
        }
      }

      let calculatedTotalAmount = lineItems.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        const lineTotal = quantity * unitPrice;
        item.line_total_amount = lineTotal.toFixed(2);
        return sum + lineTotal;
      }, 0);
      invoiceData.total_amount = calculatedTotalAmount.toFixed(2);
    }

    const [updatedInvoiceCount] = await Invoice.update(invoiceData, {
      where: { invoice_id: invoice_id },
      transaction: t,
    });

    if (lineItems && Array.isArray(lineItems)) {
      const existingLineItems = await InvoiceLineItem.findAll({ where: { invoice_id: invoice_id }, transaction: t });
      const existingLineItemIds = new Set(existingLineItems.map(item => item.invoice_line_id));
      const incomingLineItemIds = new Set(lineItems.map(item => item.invoice_line_id).filter(Boolean));

      const lineItemsToDelete = existingLineItems.filter(
        item => !incomingLineItemIds.has(item.invoice_line_id)
      );
      for (const itemToDelete of lineItemsToDelete) {
        await itemToDelete.destroy({ transaction: t });
      }

      for (const item of lineItems) {
        if (item.invoice_line_id && existingLineItemIds.has(item.invoice_line_id)) {
          await InvoiceLineItem.update(item, {
            where: { invoice_line_id: item.invoice_line_id },
            transaction: t,
          });
        } else {
          await InvoiceLineItem.create({ ...item, invoice_id: invoice_id }, { transaction: t });
        }
      }
    }

    await t.commit();
    const updatedInvoice = await Invoice.findByPk(invoice_id, {
      include: [{ model: InvoiceLineItem, as: 'lineItems', include: [{ model: ChartOfAccount, as: 'account' }] }, { model: db.Party, as: 'party' }]
    });
    res.status(200).json(updatedInvoice);
  } catch (error) {
    await t.rollback();
    console.error('Error in updateInvoice:', error);
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Delete an invoice by ID (Line items will be deleted automatically due to CASCADE)
exports.deleteInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const invoice_id = req.params.invoice_id;
    const invoice = await Invoice.findByPk(invoice_id, { transaction: t });

    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    // Prevent deletion of posted or paid invoices for auditability
    if (invoice.status.startsWith('Posted_') || invoice.status === 'Paid' || invoice.status === 'Partially Paid') {
      await t.rollback();
      return res.status(403).json({ error: `Cannot delete a ${invoice.status} invoice. Consider creating a credit note or a reversal journal entry instead.` });
    }

    const deleted = await Invoice.destroy({
      where: { invoice_id: invoice_id },
      transaction: t,
    });

    if (deleted) {
      await t.commit();
      res.status(204).send();
    } else {
      await t.rollback();
      res.status(400).json({ error: 'Failed to delete invoice.' });
    }
  } catch (error) {
    await t.rollback();
    console.error('Error in deleteInvoice:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Posts an invoice, generating corresponding financial transactions.
 * Differentiates between cash and credit sales.
 * Expects { payment_method: 'Cash' | 'Credit', addedby: UUID, branch_id: UUID } in req.body
 */
exports.postInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const invoice_id = req.params.invoice_id;
    const { payment_method, addedby, branch_id } = req.body;

    if (!payment_method || !['Cash', 'Credit'].includes(payment_method)) {
      await t.rollback();
      return res.status(400).json({ error: 'payment_method must be either "Cash" or "Credit".' });
    }
    if (!addedby || !branch_id) {
      await t.rollback();
      return res.status(400).json({ error: 'addedby (user ID) and branch_id are required for posting transactions.' });
    }

    const invoice = await Invoice.findByPk(invoice_id, {
      include: [{ model: InvoiceLineItem, as: 'lineItems' }],
      transaction: t,
    });

    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (invoice.status !== 'Draft') {
      await t.rollback();
      return res.status(400).json({ error: `Invoice is already '${invoice.status}'. Only 'Draft' invoices can be posted.` });
    }
    if (invoice.lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Invoice cannot be posted without line items.' });
    }

    const accountsReceivableAccount = await findAccountByName('Accounts Receivable', t);
    const salesRevenueAccount = await findAccountByName('Sales Revenue', t);
    const cashAccount = await findAccountByName('Cash', t); // Or 'Bank'

    const postingUser = await User.findByPk(addedby, { transaction: t });
    if (!postingUser) {
      await t.rollback();
      return res.status(400).json({ error: `Invalid user ID provided for 'addedby': ${addedby}` });
    }
    const postingBranch = await Branch.findByPk(branch_id, { transaction: t });
    if (!postingBranch) {
      await t.rollback();
      return res.status(400).json({ error: `Invalid branch ID provided for 'branch_id': ${branch_id}` });
    }

    const transactionDate = invoice.issue_date;
    const transactionDescription = `Invoice Sale: ${invoice.document_no} - ${invoice.party_id}`;
    const newTransactionNo = `INV-JE-${invoice.document_no}`;

    const transactionsToCreate = [];
    let newInvoiceStatus;

    // Aggregate revenue by account from line items
    const revenueByAccount = invoice.lineItems.reduce((acc, item) => {
        if (item.account_id && parseFloat(item.line_total_amount) > 0) {
            acc[item.account_id] = (acc[item.account_id] || 0) + parseFloat(item.line_total_amount);
        }
        return acc;
    }, {});

    // Credit individual revenue accounts based on line items
    for (const accountId in revenueByAccount) {
        const revenueAmount = revenueByAccount[accountId];
        const revenueAccount = await ChartOfAccount.findByPk(accountId, { transaction: t });
        if (!revenueAccount) {
            await t.rollback();
            return res.status(400).json({ error: `Revenue account with ID ${accountId} not found.` });
        }

        transactionsToCreate.push({
            transaction_no: newTransactionNo,
            transaction_type: payment_method === 'Credit' ? 'Invoice Sale (Credit)' : 'Invoice Sale (Cash)',
            account_id: revenueAccount.account_id,
            amount: revenueAmount,
            date: transactionDate,
            description: `Revenue from Invoice ${invoice.document_no} - ${revenueAccount.name}`,
            debit: 0,
            credit: revenueAmount,
            reference_no: invoice.invoice_id,
            is_posted: true,
            branch_id: branch_id,
            addedby: addedby,
        });
    }

    if (payment_method === 'Credit') {
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: 'Invoice Sale (Credit)',
        account_id: accountsReceivableAccount.account_id,
        amount: invoice.total_amount,
        date: transactionDate,
        description: `Accounts Receivable for Invoice ${invoice.document_no}`,
        debit: invoice.total_amount,
        credit: 0,
        reference_no: invoice.invoice_id,
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
      newInvoiceStatus = 'Posted_Credit_Sale';
    } else if (payment_method === 'Cash') {
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: 'Invoice Sale (Cash)',
        account_id: cashAccount.account_id,
        amount: invoice.total_amount,
        date: transactionDate,
        description: `Cash received for Invoice ${invoice.document_no}`,
        debit: invoice.total_amount,
        credit: 0,
        reference_no: invoice.invoice_id,
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
      newInvoiceStatus = 'Posted_Cash_Sale';
    }

    await Transaction.bulkCreate(transactionsToCreate, { transaction: t });
    await invoice.update({ status: newInvoiceStatus }, { transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Invoice posted and transactions generated successfully.', invoice_id: invoice.invoice_id, new_status: newInvoiceStatus });

  } catch (error) {
    await t.rollback();
    console.error('Error in postInvoice:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error: ' + error.message });
  }
};

/**
 * Records a payment for one or more invoices.
 * If specific allocations are provided, it uses them. Otherwise, it uses FIFO.
 * req.body should contain:
 * {
 * payment_date: 'YYYY-MM-DD',
 * amount: DECIMAL,
 * payment_method: ENUM,
 * party_id: UUID, // Customer who made the payment
 * account_id: UUID, // Cash/Bank account
 * document_no: STRING, // Payment reference number (e.g., check number)
 * description: TEXT (optional),
 * addedby: UUID,
 * branch_id: UUID,
 * allocations: [ // Optional array of specific invoice allocations
 * { invoice_id: UUID, allocated_amount: DECIMAL },
 * ...
 * ]
 * }
 */
exports.recordPayment = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const {
      payment_date,
      amount,
      payment_method,
      party_id,
      account_id,
      document_no,
      description,
      addedby,
      branch_id,
      allocations // This will be an array if provided by user, otherwise undefined
    } = req.body;

    if (!payment_date || !amount || !payment_method || !party_id || !account_id || !document_no || !addedby || !branch_id) {
      await t.rollback();
      return res.status(400).json({ error: 'Missing required payment fields.' });
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Payment amount must be a positive number.' });
    }

    // Validate foreign keys
    const paymentParty = await db.Party.findByPk(party_id, { transaction: t });
    if (!paymentParty || paymentParty.party_type !== 'Customer') {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid party_id or party is not a customer.' });
    }
    const paymentAccount = await ChartOfAccount.findByPk(account_id, { transaction: t });
    if (!paymentAccount) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid account_id for payment received (Cash/Bank account).' });
    }
    const postingUser = await User.findByPk(addedby, { transaction: t });
    if (!postingUser) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid addedby user ID.' });
    }
    const postingBranch = await Branch.findByPk(branch_id, { transaction: t });
    if (!postingBranch) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid branch ID.' });
    }

    // Create the main Payment record
    const newPayment = await Payment.create({
      document_no,
      payment_date,
      amount: paymentAmount,
      payment_method,
      type: 'Received',
      party_id,
      account_id,
      description,
      status: 'Unapplied', // Will be updated after allocations
    }, { transaction: t });

    let remainingPayment = paymentAmount;
    const paymentAllocationsToCreate = [];
    const transactionsToCreate = [];

    // --- Journal Entry for the Payment Received (Debit Cash/Bank, Credit Accounts Receivable) ---
    const accountsReceivableAccount = await findAccountByName('Accounts Receivable', t);

    transactionsToCreate.push({
      transaction_no: `PMT-IN-${newPayment.document_no}`,
      transaction_type: `Payment Received (${newPayment.payment_method})`,
      account_id: newPayment.account_id, // The Cash/Bank account
      amount: paymentAmount,
      date: payment_date,
      description: `Payment received from ${paymentParty.first_name} ${paymentParty.last_name} (Ref: ${newPayment.document_no})`,
      debit: paymentAmount,
      credit: 0,
      reference_no: newPayment.payment_id, // Link to the Payment ID
      is_posted: true,
      branch_id: branch_id,
      addedby: addedby,
    });
    transactionsToCreate.push({
      transaction_no: `PMT-IN-${newPayment.document_no}`,
      transaction_type: `Payment Received (${newPayment.payment_method})`,
      account_id: accountsReceivableAccount.account_id,
      amount: paymentAmount,
      date: payment_date,
      description: `Reduction of Accounts Receivable for ${paymentParty.first_name} ${paymentParty.last_name} (Ref: ${newPayment.document_no})`,
      debit: 0,
      credit: paymentAmount,
      reference_no: newPayment.payment_id, // Link to the Payment ID
      is_posted: true,
      branch_id: branch_id,
      addedby: addedby,
    });


    // --- Allocation Logic ---
    let invoicesToUpdate = [];

    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      // Manual Allocation: Process user-provided allocations
      let totalAllocatedAmount = 0;
      for (const alloc of allocations) {
        const invoice = await Invoice.findByPk(alloc.invoice_id, { transaction: t });
        if (!invoice || invoice.party_id !== party_id || invoice.outstanding_balance <= 0) {
          await t.rollback();
          return res.status(400).json({ error: `Invalid invoice ID ${alloc.invoice_id} for allocation or no outstanding balance.` });
        }
        const currentInvoiceOutstanding = parseFloat(invoice.outstanding_balance);
        const amountToAllocate = parseFloat(alloc.allocated_amount);

        if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
          await t.rollback();
          return res.status(400).json({ error: `Invalid allocated_amount for invoice ${alloc.invoice_id}.` });
        }
        if (amountToAllocate > remainingPayment) {
          await t.rollback();
          return res.status(400).json({ error: `Allocated amount for invoice ${invoice.document_no} exceeds remaining payment.` });
        }
        if (amountToAllocate > currentInvoiceOutstanding) {
          await t.rollback();
          return res.status(400).json({ error: `Allocated amount for invoice ${invoice.document_no} exceeds its outstanding balance.` });
        }

        paymentAllocationsToCreate.push({
          payment_id: newPayment.payment_id,
          invoice_id: invoice.invoice_id,
          allocated_amount: amountToAllocate,
          allocation_date: payment_date,
          notes: `Allocated from payment ${newPayment.document_no}`,
        });
        invoicesToUpdate.push({
          invoice: invoice,
          amount: amountToAllocate
        });
        remainingPayment -= amountToAllocate;
        totalAllocatedAmount += amountToAllocate;
      }
      if (Math.abs(totalAllocatedAmount - paymentAmount) > 0.01 && remainingPayment > 0.01) {
        // If there's still a significant amount remaining after manual allocations,
        // it means the user only allocated part of the payment. We keep status as Partially Applied
        // or Unapplied if nothing was allocated.
      }
    } else {
      // Automatic FIFO Allocation: No specific allocations provided, apply to oldest invoices
      const outstandingInvoices = await Invoice.findAll({
        where: {
          party_id: party_id,
          outstanding_balance: { [Op.gt]: 0 }, // Greater than 0
          status: { [Op.notIn]: ['Cancelled', 'Paid'] } // Exclude cancelled and already fully paid
        },
        order: [['due_date', 'ASC']], // Oldest first
        transaction: t,
      });

      for (const invoice of outstandingInvoices) {
        if (remainingPayment <= 0.01) break; // If payment is fully allocated, stop

        const amountToApply = Math.min(remainingPayment, parseFloat(invoice.outstanding_balance));

        paymentAllocationsToCreate.push({
          payment_id: newPayment.payment_id,
          invoice_id: invoice.invoice_id,
          allocated_amount: amountToApply,
          allocation_date: payment_date,
          notes: `Auto-allocated from payment ${newPayment.document_no}`,
        });
        invoicesToUpdate.push({
          invoice: invoice,
          amount: amountToApply
        });
        remainingPayment -= amountToApply;
      }
    }

    // Create Payment Allocations
    if (paymentAllocationsToCreate.length > 0) {
      await PaymentAllocation.bulkCreate(paymentAllocationsToCreate, { transaction: t });
    }

    // Update Invoices' amount_paid and status
    for (const { invoice, amount } of invoicesToUpdate) {
      invoice.amount_paid = parseFloat(invoice.amount_paid) + amount;
      // The beforeSave hook in the Invoice model will automatically calculate outstanding_balance
      // and update the status to 'Paid' or 'Partially Paid' based on the new amount_paid.
      await invoice.save({ transaction: t });
    }

    // Update overall Payment status based on remaining amount
    if (remainingPayment <= 0.01) {
      await newPayment.update({ status: 'Fully Applied' }, { transaction: t });
    } else if (paymentAmount > remainingPayment) {
      await newPayment.update({ status: 'Partially Applied' }, { transaction: t });
    } else {
      await newPayment.update({ status: 'Unapplied' }, { transaction: t }); // If nothing was allocated or only a negligible amount
    }

    await Transaction.bulkCreate(transactionsToCreate, { transaction: t });
    await t.commit();

    res.status(201).json({
      message: 'Payment recorded and allocated successfully.',
      payment: newPayment,
      allocations: paymentAllocationsToCreate,
    });

  } catch (error) {
    await t.rollback();
    console.error('Error in recordPayment (Invoice):', error);
    res.status(500).json({ error: error.message || 'Internal Server Error: ' + error.message });
  }
};
