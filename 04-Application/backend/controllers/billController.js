// /04-Application/backend/controllers/billController.js

const db = require('../models');
const Bill = db.Bill;
const BillLineItem = db.BillLineItem;
const Transaction = db.Transaction;
const ChartOfAccount = db.ChartOfAccount;
const User = db.User;
const Branch = db.Branch;
const { Op } = require('sequelize'); // Import Op for complex queries

// Helper function to find a ChartOfAccount by its ID (for direct validation)
// or by its name (for common accounts like Accounts Payable, Cash)
const findAccountByIdOrName = async (accountIdOrName, transaction) => {
  if (accountIdOrName.includes('-')) { // Assuming UUIDs contain hyphens
    const account = await ChartOfAccount.findByPk(accountIdOrName, { transaction });
    if (!account) {
      throw new Error(`Account with ID '${accountIdOrName}' not found in Chart of Accounts.`);
    }
    return account;
  } else {
    const account = await ChartOfAccount.findOne({
      where: { name: accountIdOrName },
      transaction,
    });
    if (!account) {
      throw new Error(`Required account '${accountIdOrName}' not found in Chart of Accounts.`);
    }
    return account;
  }
};


// Get all bills, including their line items and associated party
exports.getAllBills = async (req, res) => {
  try {
    const bills = await Bill.findAll({
      include: [
        { model: db.Party, as: 'party' }, // Include the associated Party (Supplier)
        {
          model: BillLineItem,
          as: 'lineItems',
          include: [{ model: ChartOfAccount, as: 'account' }] // Include the associated Account for each line item
        }
      ],
      order: [['issue_date', 'DESC']],
    });
    res.status(200).json(bills);
  } catch (error) {
    console.error('Error in getAllBills:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single bill by ID, including its line items and associated party
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.bill_id, {
      include: [
        { model: db.Party, as: 'party' },
        {
          model: BillLineItem,
          as: 'lineItems',
          include: [{ model: ChartOfAccount, as: 'account' }]
        }
      ]
    });
    if (bill) {
      res.status(200).json(bill);
    } else {
      res.status(404).json({ error: 'Bill not found' });
    }
  } catch (error) {
    console.error('Error in getBillById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Create a new bill with nested line items
exports.createBill = async (req, res) => {
  const t = await db.sequelize.transaction(); // Start a transaction
  try {
    const { lineItems, ...billData } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Bill must have at least one line item.' });
    }

    // Validate if the selected party is a 'Supplier'
    const party = await db.Party.findByPk(billData.party_id, { transaction: t });
    if (!party || party.party_type !== 'Supplier') {
      await t.rollback();
      return res.status(400).json({ error: 'Selected party must be a Supplier.' });
    }

    // Calculate total_amount from line items
    let calculatedTotalAmount = lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const lineTotal = quantity * unitPrice;
      item.line_total_amount = lineTotal.toFixed(2);
      return sum + lineTotal;
    }, 0);

    billData.total_amount = calculatedTotalAmount.toFixed(2);

    // Create the main bill record
    const newBill = await Bill.create(billData, { transaction: t });

    // Create bill line items, associating them with the new bill
    const newLineItems = lineItems.map(item => ({
      ...item,
      bill_id: newBill.bill_id // Link each line item to the newly created bill
    }));
    await BillLineItem.bulkCreate(newLineItems, { transaction: t });

    await t.commit();
    const createdBillWithLines = await Bill.findByPk(newBill.bill_id, {
      include: [{ model: BillLineItem, as: 'lineItems', include: [{ model: ChartOfAccount, as: 'account' }] }, { model: db.Party, as: 'party' }]
    });
    res.status(201).json(createdBillWithLines);
  } catch (error) {
    await t.rollback();
    console.error('Error in createBill:', error);
    // Provide more specific error messages for common issues
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: `Document number '${req.body.document_no}' already exists.` });
    }
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Update a bill by ID, including its line items
exports.updateBill = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const bill_id = req.params.bill_id;
    const { lineItems, ...billData } = req.body;

    const existingBill = await Bill.findByPk(bill_id, { transaction: t });

    if (!existingBill) {
      await t.rollback();
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Prevent updates if the bill is already paid or cancelled (posted implies paid/approved)
    if (existingBill.status === 'Paid' || existingBill.status === 'Cancelled') {
        await t.rollback();
        return res.status(403).json({ error: `Cannot update a bill with status '${existingBill.status}'.` });
    }

    // Update main bill fields
    if (lineItems && Array.isArray(lineItems)) {
        if (lineItems.length === 0) {
            await t.rollback();
            return res.status(400).json({ error: 'Bill must have at least one line item.' });
        }
        let calculatedTotalAmount = lineItems.reduce((sum, item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const unitPrice = parseFloat(item.unit_price) || 0;
            const lineTotal = quantity * unitPrice;
            item.line_total_amount = lineTotal.toFixed(2);
            return sum + lineTotal;
        }, 0);
        billData.total_amount = calculatedTotalAmount.toFixed(2);
    }

    const [updatedBillCount] = await Bill.update(billData, {
      where: { bill_id: bill_id },
      transaction: t,
    });

    // Handle BillLineItems updates/creates/deletes
    if (lineItems && Array.isArray(lineItems)) {
      const existingLineItems = await BillLineItem.findAll({ where: { bill_id: bill_id }, transaction: t });
      const existingLineItemIds = new Set(existingLineItems.map(item => item.bill_line_id));
      const incomingLineItemIds = new Set(lineItems.map(item => item.bill_line_id).filter(Boolean));

      // Identify line items to delete
      const lineItemsToDelete = existingLineItems.filter(
        item => !incomingLineItemIds.has(item.bill_line_id)
      );
      for (const itemToDelete of lineItemsToDelete) {
        await itemToDelete.destroy({ transaction: t });
      }

      // Process incoming line items (create new or update existing)
      for (const item of lineItems) {
        // Validate account_id for each line item
        await findAccountByIdOrName(item.account_id, t); // Ensures account_id is valid

        if (item.bill_line_id && existingLineItemIds.has(item.bill_line_id)) {
          // Update existing line item
          await BillLineItem.update(item, {
            where: { bill_line_id: item.bill_line_id },
            transaction: t,
          });
        } else {
          // Create new line item
          await BillLineItem.create({ ...item, bill_id: bill_id }, { transaction: t });
        }
      }
    }

    await t.commit();
    const updatedBill = await Bill.findByPk(bill_id, {
      include: [{ model: BillLineItem, as: 'lineItems', include: [{ model: ChartOfAccount, as: 'account' }] }, { model: db.Party, as: 'party' }]
    });
    res.status(200).json(updatedBill);
  } catch (error) {
    await t.rollback();
    console.error('Error in updateBill:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: `Document number '${req.body.document_no}' already exists.` });
    }
    res.status(400).json({ error: error.message || 'Bad Request' });
  }
};

// Delete a bill by ID (Line items will be deleted automatically due to CASCADE)
exports.deleteBill = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const bill_id = req.params.bill_id;
    const bill = await Bill.findByPk(bill_id, { transaction: t });

    if (!bill) {
      await t.rollback();
      return res.status(404).json({ error: 'Bill not found.' });
    }

    // Prevent deletion of paid or approved bills for auditability
    if (bill.status === 'Paid' || bill.status === 'Approved') { // Assuming 'Approved' means posted
      await t.rollback();
      return res.status(403).json({ error: `Cannot delete a bill with status '${bill.status}'. Consider a credit note or reversal instead.` });
    }

    const deleted = await Bill.destroy({
      where: { bill_id: bill_id },
      transaction: t,
    });

    if (deleted) {
      await t.commit();
      res.status(204).send();
    } else {
      await t.rollback();
      res.status(400).json({ error: 'Failed to delete bill.' });
    }
  } catch (error) {
    await t.rollback();
    console.error('Error in deleteBill:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Posts a bill, generating corresponding financial transactions.
 * Expects { payment_method: 'Cash' | 'Credit', addedby: UUID, branch_id: UUID } in req.body
 */
exports.postBill = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const bill_id = req.params.bill_id;
    const { payment_method, addedby, branch_id } = req.body;

    if (!payment_method || !['Cash', 'Credit'].includes(payment_method)) {
      await t.rollback();
      return res.status(400).json({ error: 'payment_method must be either "Cash" or "Credit".' });
    }
    if (!addedby || !branch_id) {
        await t.rollback();
        return res.status(400).json({ error: 'addedby (user ID) and branch_id are required for posting transactions.' });
    }

    const bill = await Bill.findByPk(bill_id, {
      include: [{
        model: BillLineItem,
        as: 'lineItems',
        include: [{ model: ChartOfAccount, as: 'account' }] // Crucial to get account details
      }],
      transaction: t,
    });

    if (!bill) {
      await t.rollback();
      return res.status(404).json({ error: 'Bill not found.' });
    }

    if (bill.status !== 'Draft' && bill.status !== 'Pending Approval') { // Allow posting from Draft or Pending Approval
      await t.rollback();
      return res.status(400).json({ error: `Bill is already '${bill.status}'. Only 'Draft' or 'Pending Approval' bills can be posted.` });
    }
    if (bill.lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Bill cannot be posted without line items.' });
    }

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

    const accountsPayableAccount = await findAccountByIdOrName('Accounts Payable', t);
    const cashAccount = await findAccountByIdOrName('Cash', t); // Or 'Bank'


    const transactionDate = bill.issue_date; // Use bill issue date for transactions
    const newTransactionNo = `BILL-JE-${bill.document_no}`; // Unique JE number for this posting

    const transactionsToCreate = [];

    // Debit individual expense/asset accounts based on BillLineItem.account_id
    bill.lineItems.forEach(item => {
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: `Bill Expense/Asset (${payment_method})`,
        account_id: item.account_id, // This is the dynamically selected account for the line item
        amount: item.line_total_amount,
        date: transactionDate,
        description: `Bill: ${bill.document_no} - ${item.description}`,
        debit: item.line_total_amount,
        credit: 0,
        reference_no: bill.bill_id, // Link back to bill
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
    });

    // Credit Accounts Payable or Cash/Bank
    if (payment_method === 'Credit') {
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: `Bill Expense/Asset (Credit)`,
        account_id: accountsPayableAccount.account_id,
        amount: bill.total_amount,
        date: transactionDate,
        description: `Bill: ${bill.document_no} - Total`,
        debit: 0,
        credit: bill.total_amount,
        reference_no: bill.bill_id,
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
    } else if (payment_method === 'Cash') {
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: `Bill Expense/Asset (Cash)`,
        account_id: cashAccount.account_id,
        amount: bill.total_amount,
        date: transactionDate,
        description: `Bill: ${bill.document_no} - Total`,
        debit: 0,
        credit: bill.total_amount,
        reference_no: bill.bill_id,
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
    }

    // Create the transactions
    await Transaction.bulkCreate(transactionsToCreate, { transaction: t });

    // Update the bill status
    await bill.update({ status: payment_method === 'Cash' ? 'Paid' : 'Approved' }, { transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Bill posted and transactions generated successfully.', bill_id: bill.bill_id, new_status: bill.status });

  } catch (error) {
    await t.rollback();
    console.error('Error in postBill:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error: ' + error.message });
  }
};
