// /04-Application/backend/controllers/invoiceController.js

const db = require('../models');
const Invoice = db.Invoice;
const InvoiceLineItem = db.InvoiceLineItem; 
const Transaction = db.Transaction;     
const ChartOfAccount = db.ChartOfAccount; 
const User = db.User;                   
const Branch = db.Branch;             

// Helper function to find a ChartOfAccount by its name and type (e.g., 'Cash' for 'Asset')
// This makes the posting logic more robust by not relying on hardcoded UUIDs.
const findAccountByName = async (accountName, transaction) => {
  // Attempt to find by name, or by specific attributes if name isn't unique enough
  const account = await ChartOfAccount.findOne({
    where: { name: accountName },
    transaction, // Pass the transaction object for atomicity
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
        { model: db.Party, as: 'party' }, // Include the associated Party
        { model: InvoiceLineItem, as: 'lineItems' } // Include associated line items
      ],
      order: [['issue_date', 'DESC']], // Order by most recent invoices first
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
        { model: db.Party, as: 'party' }, // Include the associated Party
        { model: InvoiceLineItem, as: 'lineItems' } // Include associated line items
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
  const t = await db.sequelize.transaction(); // Start a transaction for atomicity
  try {
    const { lineItems, ...invoiceData } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Invoice must have at least one line item.' });
    }

    // Calculate total_amount from line items
    let calculatedTotalAmount = lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const lineTotal = quantity * unitPrice;
      // Ensure line_total_amount is also set in the item for consistency
      item.line_total_amount = lineTotal.toFixed(2);
      return sum + lineTotal;
    }, 0);

    invoiceData.total_amount = calculatedTotalAmount.toFixed(2); // Set the calculated total

    // Create the main invoice record
    const newInvoice = await Invoice.create(invoiceData, { transaction: t });

    // Create invoice line items, associating them with the new invoice
    const newLineItems = lineItems.map(item => ({
      ...item,
      invoice_id: newInvoice.invoice_id // Link each line item to the newly created invoice
    }));
    await InvoiceLineItem.bulkCreate(newLineItems, { transaction: t });

    await t.commit(); // Commit the transaction
    const createdInvoiceWithLines = await Invoice.findByPk(newInvoice.invoice_id, {
      include: [{ model: InvoiceLineItem, as: 'lineItems' }, { model: db.Party, as: 'party' }]
    });
    res.status(201).json(createdInvoiceWithLines);
  } catch (error) {
    await t.rollback(); // Rollback if any step fails
    console.error('Error in createInvoice:', error);
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Update an invoice by ID, including its line items
exports.updateInvoice = async (req, res) => {
  const t = await db.sequelize.transaction(); // Start a transaction
  try {
    const invoice_id = req.params.invoice_id;
    const { lineItems, ...invoiceData } = req.body;

    const existingInvoice = await Invoice.findByPk(invoice_id, { transaction: t });

    if (!existingInvoice) {
      await t.rollback();
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // You might want to prevent updates if the invoice is already posted
    if (existingInvoice.status.startsWith('Posted_')) {
        await t.rollback();
        return res.status(403).json({ error: 'Cannot update a posted invoice. Create a new invoice or a credit note instead.' });
    }

    // Update main invoice fields
    if (lineItems && Array.isArray(lineItems)) {
        if (lineItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Invoice must have at least one line item.' });
        }
        let calculatedTotalAmount = lineItems.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            const lineTotal = quantity * unitPrice;
            item.line_total_amount = lineTotal.toFixed(2); // Ensure consistency
            return sum + lineTotal;
        }, 0);
        invoiceData.total_amount = calculatedTotalAmount.toFixed(2);
    }

    const [updatedInvoiceCount] = await Invoice.update(invoiceData, {
      where: { invoice_id: invoice_id },
      transaction: t,
    });

    // Handle InvoiceLineItems updates/creates/deletes
    if (lineItems && Array.isArray(lineItems)) {
      const existingLineItems = await InvoiceLineItem.findAll({ where: { invoice_id: invoice_id }, transaction: t });
      const existingLineItemIds = new Set(existingLineItems.map(item => item.invoice_line_id));
      const incomingLineItemIds = new Set(lineItems.map(item => item.invoice_line_id).filter(Boolean)); // Filter out null/undefined

      // Identify line items to delete
      const lineItemsToDelete = existingLineItems.filter(
        item => !incomingLineItemIds.has(item.invoice_line_id)
      );
      for (const itemToDelete of lineItemsToDelete) {
        await itemToDelete.destroy({ transaction: t });
      }

      // Process incoming line items (create new or update existing)
      for (const item of lineItems) {
        if (item.invoice_line_id && existingLineItemIds.has(item.invoice_line_id)) {
          // Update existing line item
          await InvoiceLineItem.update(item, {
            where: { invoice_line_id: item.invoice_line_id },
            transaction: t,
          });
        } else {
          // Create new line item
          await InvoiceLineItem.create({ ...item, invoice_id: invoice_id }, { transaction: t });
        }
      }
    }

    await t.commit(); // Commit the transaction
    const updatedInvoice = await Invoice.findByPk(invoice_id, {
      include: [{ model: InvoiceLineItem, as: 'lineItems' }, { model: db.Party, as: 'party' }]
    });
    res.status(200).json(updatedInvoice);
  } catch (error) {
    await t.rollback(); // Rollback if any step fails
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

    // Prevent deletion of posted invoices for auditability
    if (invoice.status.startsWith('Posted_')) {
      await t.rollback();
      return res.status(403).json({ error: 'Cannot delete a posted invoice. Consider creating a credit note or a reversal journal entry instead.' });
    }

    const deleted = await Invoice.destroy({
      where: { invoice_id: invoice_id },
      transaction: t,
    });

    if (deleted) {
      await t.commit();
      res.status(204).send(); // 204 No Content for successful deletion
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
  const t = await db.sequelize.transaction(); // Start a transaction for atomicity
  try {
    const invoice_id = req.params.invoice_id;
    const { payment_method, addedby, branch_id } = req.body; // Expect these from frontend

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

    // Validate if required accounts exist in Chart of Accounts
    const accountsReceivableAccount = await findAccountByName('Accounts Receivable', t);
    const salesRevenueAccount = await findAccountByName('Sales Revenue', t);
    const cashAccount = await findAccountByName('Cash', t); // Or 'Bank'
    
    // Validate addedby and branch_id
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

    const transactionDate = invoice.issue_date; // Use invoice issue date for transactions
    const transactionDescription = `Invoice Sale: ${invoice.document_no} - ${invoice.party_id}`; // General description
    const newTransactionNo = `INV-JE-${invoice.document_no}`; // Unique JE number for this posting

    const transactionsToCreate = [];
    let newInvoiceStatus;

    if (payment_method === 'Credit') {
      // Debit Accounts Receivable
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: 'Invoice Sale (Credit)',
        account_id: accountsReceivableAccount.account_id,
        amount: invoice.total_amount,
        date: transactionDate,
        description: transactionDescription,
        debit: invoice.total_amount,
        credit: 0,
        reference_no: invoice.invoice_id, // Link back to invoice
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
      newInvoiceStatus = 'Posted_Credit_Sale';
    } else if (payment_method === 'Cash') {
      // Debit Cash/Bank Account directly
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: 'Invoice Sale (Cash)',
        account_id: cashAccount.account_id,
        amount: invoice.total_amount,
        date: transactionDate,
        description: transactionDescription,
        debit: invoice.total_amount,
        credit: 0,
        reference_no: invoice.invoice_id, // Link back to invoice
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
      newInvoiceStatus = 'Posted_Cash_Sale';
    }

    // Credit Sales Revenue for both cash and credit sales
    transactionsToCreate.push({
      transaction_no: newTransactionNo,
      transaction_type: payment_method === 'Credit' ? 'Invoice Sale (Credit)' : 'Invoice Sale (Cash)',
      account_id: salesRevenueAccount.account_id,
      amount: invoice.total_amount,
      date: transactionDate,
      description: transactionDescription,
      debit: 0,
      credit: invoice.total_amount,
      reference_no: invoice.invoice_id, // Link back to invoice
      is_posted: true,
      branch_id: branch_id,
      addedby: addedby,
    });

    // Create the transactions
    await Transaction.bulkCreate(transactionsToCreate, { transaction: t });

    // Update the invoice status
    await invoice.update({ status: newInvoiceStatus }, { transaction: t });

    await t.commit(); // Commit the entire operation
    res.status(200).json({ message: 'Invoice posted and transactions generated successfully.', invoice_id: invoice.invoice_id, new_status: newInvoiceStatus });

  } catch (error) {
    await t.rollback(); // Rollback if any error occurs
    console.error('Error in postInvoice:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error: ' + error.message });
  }
};

// Delete an invoice by ID
// NOTE: Sequelize's onDelete: 'CASCADE' in the model association (index.js)
// will automatically delete associated InvoiceLineItems when the Invoice is deleted.
// However, this controller specifically prevents deletion of 'Posted' invoices
// to maintain auditability. Reversal (credit note) is the accounting way.
// Any transactions generated by posting are NOT automatically deleted by invoice deletion;
// they would need a separate reversal process (e.g., via transactionController.reverseTransaction).
exports.deleteInvoice = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const invoice_id = req.params.invoice_id;
    const invoice = await Invoice.findByPk(invoice_id, { transaction: t });

    if (!invoice) {
      await t.rollback();
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    // Prevent deletion of posted invoices for auditability
    if (invoice.status.startsWith('Posted_')) {
      await t.rollback();
      return res.status(403).json({ error: 'Cannot delete a posted invoice. Consider creating a credit note or a reversal journal entry instead.' });
    }

    const deleted = await Invoice.destroy({
      where: { invoice_id: invoice_id },
      transaction: t,
    });

    if (deleted) {
      await t.commit();
      res.status(204).send(); // 204 No Content for successful deletion
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
