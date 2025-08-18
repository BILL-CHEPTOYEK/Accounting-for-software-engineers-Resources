// /04-Application/backend/controllers/billController.js

const db = require('../models');
const Bill = db.Bill;
const BillLineItem = db.BillLineItem;
const Transaction = db.Transaction;
const ChartOfAccount = db.ChartOfAccount;
const User = db.User;
const Branch = db.Branch;
const Payment = db.Payment; // NEW: Import Payment model
const PaymentAllocation = db.PaymentAllocation; // NEW: Import PaymentAllocation model
const { Op } = require('sequelize');

// Helper function to find a ChartOfAccount by its ID (for direct validation)
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
        { model: db.Party, as: 'party' },
        {
          model: BillLineItem,
          as: 'lineItems',
          include: [{ model: ChartOfAccount, as: 'account' }]
        },
        // NEW: Include PaymentAllocations to help calculate true outstanding balance
        {
          model: db.PaymentAllocation,
          as: 'paymentAllocations',
          include: [{ model: db.Payment, as: 'payment' }]
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
        },
        // NEW: Include PaymentAllocations to help calculate true outstanding balance
        {
          model: db.PaymentAllocation,
          as: 'paymentAllocations',
          include: [{ model: db.Payment, as: 'payment' }]
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
  const t = await db.sequelize.transaction();
  try {
    const { lineItems, ...billData } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Bill must have at least one line item.' });
    }

    const party = await db.Party.findByPk(billData.party_id, { transaction: t });
    if (!party || party.party_type !== 'Supplier') {
      await t.rollback();
      return res.status(400).json({ error: 'Selected party must be a Supplier.' });
    }

    let calculatedTotalAmount = lineItems.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const lineTotal = quantity * unitPrice;
      item.line_total_amount = lineTotal.toFixed(2);
      return sum + lineTotal;
    }, 0);

    billData.total_amount = calculatedTotalAmount.toFixed(2);
    // Initialize amount_paid and outstanding_balance for new bills
    billData.amount_paid = 0.00;
    billData.outstanding_balance = parseFloat(billData.total_amount);


    const newBill = await Bill.create(billData, { transaction: t });

    const newLineItems = lineItems.map(item => ({
      ...item,
      bill_id: newBill.bill_id
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

    if (existingBill.status === 'Paid' || existingBill.status === 'Cancelled' || existingBill.status === 'Approved' || existingBill.status === 'Partially Paid') {
      await t.rollback();
      return res.status(403).json({ error: `Cannot update a bill with status '${existingBill.status}'.` });
    }

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

    if (lineItems && Array.isArray(lineItems)) {
      const existingLineItems = await BillLineItem.findAll({ where: { bill_id: bill_id }, transaction: t });
      const existingLineItemIds = new Set(existingLineItems.map(item => item.bill_line_id));
      const incomingLineItemIds = new Set(lineItems.map(item => item.bill_line_id).filter(Boolean));

      const lineItemsToDelete = existingLineItems.filter(
        item => !incomingLineItemIds.has(item.bill_line_id)
      );
      for (const itemToDelete of lineItemsToDelete) {
        await itemToDelete.destroy({ transaction: t });
      }

      for (const item of lineItems) {
        await findAccountByIdOrName(item.account_id, t);

        if (item.bill_line_id && existingLineItemIds.has(item.bill_line_id)) {
          await BillLineItem.update(item, {
            where: { bill_line_id: item.bill_line_id },
            transaction: t,
          });
        } else {
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

    if (bill.status === 'Paid' || bill.status === 'Approved' || bill.status === 'Partially Paid') {
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
        include: [{ model: ChartOfAccount, as: 'account' }]
      }],
      transaction: t,
    });

    if (!bill) {
      await t.rollback();
      return res.status(404).json({ error: 'Bill not found.' });
    }

    if (bill.status !== 'Draft' && bill.status !== 'Pending Approval') {
      await t.rollback();
      return res.status(400).json({ error: `Bill is already '${bill.status}'. Only 'Draft' or 'Pending Approval' bills can be posted.` });
    }
    if (bill.lineItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Bill cannot be posted without line items.' });
    }

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
    const cashAccount = await findAccountByIdOrName('Cash', t);

    const transactionDate = bill.issue_date;
    const newTransactionNo = `BILL-JE-${bill.document_no}`;

    const transactionsToCreate = [];

    bill.lineItems.forEach(item => {
      transactionsToCreate.push({
        transaction_no: newTransactionNo,
        transaction_type: `Bill Expense/Asset (${payment_method})`,
        account_id: item.account_id,
        amount: item.line_total_amount,
        date: transactionDate,
        description: `Bill: ${bill.document_no} - ${item.description}`,
        debit: item.line_total_amount,
        credit: 0,
        reference_no: bill.bill_id,
        is_posted: true,
        branch_id: branch_id,
        addedby: addedby,
      });
    });

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

    await Transaction.bulkCreate(transactionsToCreate, { transaction: t });
    await bill.update({ status: payment_method === 'Cash' ? 'Paid' : 'Approved' }, { transaction: t });

    await t.commit();
    res.status(200).json({ message: 'Bill posted and transactions generated successfully.', bill_id: bill.bill_id, new_status: bill.status });

  } catch (error) {
    await t.rollback();
    console.error('Error in postBill:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error: ' + error.message });
  }
};

/**
 * Records a payment for one or more bills.
 * If specific allocations are provided, it uses them. Otherwise, it uses FIFO.
 * req.body should contain:
 * {
 * payment_date: 'YYYY-MM-DD',
 * amount: DECIMAL,
 * payment_method: ENUM,
 * party_id: UUID, // Supplier to whom payment was made
 * account_id: UUID, // Cash/Bank account
 * document_no: STRING, // Payment reference number (e.g., check number)
 * description: TEXT (optional),
 * addedby: UUID,
 * branch_id: UUID,
 * allocations: [ // Optional array of specific bill allocations
 * { bill_id: UUID, allocated_amount: DECIMAL },
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
      allocations
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
    if (!paymentParty || paymentParty.party_type !== 'Supplier') {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid party_id or party is not a supplier.' });
    }
    const paymentAccount = await ChartOfAccount.findByPk(account_id, { transaction: t });
    if (!paymentAccount) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid account_id for payment made (Cash/Bank account).' });
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
      type: 'Made',
      party_id,
      account_id,
      description,
      status: 'Unapplied',
    }, { transaction: t });

    let remainingPayment = paymentAmount;
    const paymentAllocationsToCreate = [];
    const transactionsToCreate = [];

    // --- Journal Entry for the Payment Made (Debit Accounts Payable, Credit Cash/Bank) ---
    const accountsPayableAccount = await findAccountByIdOrName('Accounts Payable', t);

    transactionsToCreate.push({
      transaction_no: `PMT-OUT-${newPayment.document_no}`,
      transaction_type: `Payment Made (${newPayment.payment_method})`,
      account_id: accountsPayableAccount.account_id,
      amount: paymentAmount,
      date: payment_date,
      description: `Payment made to ${paymentParty.first_name} ${paymentParty.last_name} (Ref: ${newPayment.document_no})`,
      debit: paymentAmount,
      credit: 0,
      reference_no: newPayment.payment_id,
      is_posted: true,
      branch_id: branch_id,
      addedby: addedby,
    });
    transactionsToCreate.push({
      transaction_no: `PMT-OUT-${newPayment.document_no}`,
      transaction_type: `Payment Made (${newPayment.payment_method})`,
      account_id: newPayment.account_id, // The Cash/Bank account
      amount: paymentAmount,
      date: payment_date,
      description: `Cash/Bank outflow for payment to ${paymentParty.first_name} ${paymentParty.last_name} (Ref: ${newPayment.document_no})`,
      debit: 0,
      credit: paymentAmount,
      reference_no: newPayment.payment_id,
      is_posted: true,
      branch_id: branch_id,
      addedby: addedby,
    });

    // --- Allocation Logic ---
    let billsToUpdate = [];

    if (allocations && Array.isArray(allocations) && allocations.length > 0) {
      // Manual Allocation
      let totalAllocatedAmount = 0;
      for (const alloc of allocations) {
        const bill = await Bill.findByPk(alloc.bill_id, { transaction: t });
        if (!bill || bill.party_id !== party_id || bill.outstanding_balance <= 0) {
          await t.rollback();
          return res.status(400).json({ error: `Invalid bill ID ${alloc.bill_id} for allocation or no outstanding balance.` });
        }
        const currentBillOutstanding = parseFloat(bill.outstanding_balance);
        const amountToAllocate = parseFloat(alloc.allocated_amount);

        if (isNaN(amountToAllocate) || amountToAllocate <= 0) {
          await t.rollback();
          return res.status(400).json({ error: `Invalid allocated_amount for bill ${alloc.bill_id}.` });
        }
        if (amountToAllocate > remainingPayment) {
          await t.rollback();
          return res.status(400).json({ error: `Allocated amount for bill ${bill.document_no} exceeds remaining payment.` });
        }
        if (amountToAllocate > currentBillOutstanding) {
          await t.rollback();
          return res.status(400).json({ error: `Allocated amount for bill ${bill.document_no} exceeds its outstanding balance.` });
        }

        paymentAllocationsToCreate.push({
          payment_id: newPayment.payment_id,
          bill_id: bill.bill_id,
          allocated_amount: amountToAllocate,
          allocation_date: payment_date,
          notes: `Allocated from payment ${newPayment.document_no}`,
        });
        billsToUpdate.push({
          bill: bill,
          amount: amountToAllocate
        });
        remainingPayment -= amountToAllocate;
        totalAllocatedAmount += amountToAllocate;
      }
      if (Math.abs(totalAllocatedAmount - paymentAmount) > 0.01 && remainingPayment > 0.01) {
        // If there's still a significant amount remaining after manual allocations,
        // it means the user only allocated part of the payment.
      }
    } else {
      // Automatic FIFO Allocation
      const outstandingBills = await Bill.findAll({
        where: {
          party_id: party_id,
          outstanding_balance: { [Op.gt]: 0 },
          status: { [Op.notIn]: ['Cancelled', 'Paid'] } // Exclude cancelled and already fully paid
        },
        order: [['due_date', 'ASC']],
        transaction: t,
      });

      for (const bill of outstandingBills) {
        if (remainingPayment <= 0.01) break;

        const amountToApply = Math.min(remainingPayment, parseFloat(bill.outstanding_balance));

        paymentAllocationsToCreate.push({
          payment_id: newPayment.payment_id,
          bill_id: bill.bill_id,
          allocated_amount: amountToApply,
          allocation_date: payment_date,
          notes: `Auto-allocated from payment ${newPayment.document_no}`,
        });
        billsToUpdate.push({
          bill: bill,
          amount: amountToApply
        });
        remainingPayment -= amountToApply;
      }
    }

    // Create Payment Allocations
    if (paymentAllocationsToCreate.length > 0) {
      await PaymentAllocation.bulkCreate(paymentAllocationsToCreate, { transaction: t });
    }

    // Update Bills' amount_paid and status
    for (const { bill, amount } of billsToUpdate) {
      bill.amount_paid = parseFloat(bill.amount_paid) + amount;
      await bill.save({ transaction: t });
    }

    // Update overall Payment status based on remaining amount
    if (remainingPayment <= 0.01) {
      await newPayment.update({ status: 'Fully Applied' }, { transaction: t });
    } else if (paymentAmount > remainingPayment) {
      await newPayment.update({ status: 'Partially Applied' }, { transaction: t });
    } else {
      await newPayment.update({ status: 'Unapplied' }, { transaction: t });
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
    console.error('Error in recordPayment (Bill):', error);
    res.status(500).json({ error: error.message || 'Internal Server Error: ' + error.message });
  }
};
