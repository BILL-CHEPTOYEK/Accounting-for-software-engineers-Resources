// /04-Application/backend/controllers/transactionController.js

const db = require('../models');
const Transaction = db.Transaction;
const ChartOfAccount = db.ChartOfAccount;
const User = db.User;
const Branch = db.Branch;
const { Op } = require('sequelize'); // Import Op for complex queries

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        { model: ChartOfAccount, as: 'account' },
        { model: User, as: 'createdBy', attributes: ['user_id', 'email', 'first_name', 'last_name'] },
        { model: Branch, as: 'branch' },
      ],
      order: [['created_at', 'DESC']] // Order by creation date descending
    });
    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error in getAllTransactions:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.transaction_id, {
      include: [
        { model: ChartOfAccount, as: 'account' },
        { model: User, as: 'createdBy', attributes: ['user_id', 'email', 'first_name', 'last_name'] },
        { model: Branch, as: 'branch' },
        { model: Transaction, as: 'reversedTransaction' },
        { model: Transaction, as: 'reversingTransactions' },
      ]
    });
    if (transaction) {
      res.status(200).json(transaction);
    } else {
      res.status(404).json({ error: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Error in getTransactionById:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Creates a new Journal Entry (a set of balanced debit and credit transaction lines).
 * Expects req.body to be an array of transaction line items.
 * Each line item must have: transaction_no, transaction_type, account_id, amount, date,
 * description, debit, credit, branch_id, addedby.
 * Validates that total debits == total credits for the given transaction_no.
 */
exports.createTransaction = async (req, res) => {
  const transactionLines = req.body; // Expect an array of line items for a single journal entry

  if (!Array.isArray(transactionLines) || transactionLines.length === 0) {
    return res.status(400).json({ error: 'Request body must be an array of transaction line items.' });
  }

  // Use a database transaction to ensure atomicity
  const t = await db.sequelize.transaction();

  try {
    // Basic validation for the entire batch
    const commonTransactionNo = transactionLines[0].transaction_no;
    const commonDate = transactionLines[0].date;
    const commonBranchId = transactionLines[0].branch_id;
    const commonAddedBy = transactionLines[0].addedby;

    if (!commonTransactionNo || !commonDate || !commonBranchId || !commonAddedBy) {
      await t.rollback();
      return res.status(400).json({ error: 'All transaction lines must share a common transaction_no, date, branch_id, and addedby. Ensure these are provided in the first line item.' });
    }

    let totalDebits = 0;
    let totalCredits = 0;
    const createdTransactions = [];

    for (const line of transactionLines) {
      const {
        transaction_no, transaction_type, account_id, amount, date,
        description, debit, credit, reference_no, is_posted,
        reversal_of_transaction_id, branch_id, addedby
      } = line;

      // Validate required fields for each line
      if (!transaction_no || !transaction_type || !account_id || !amount || !date || !branch_id || !addedby) {
        await t.rollback();
        return res.status(400).json({ error: `Missing required fields in a transaction line for transaction_no ${transaction_no}.` });
      }

      // Ensure transaction_no, date, branch_id, addedby are consistent across all lines
      if (line.transaction_no !== commonTransactionNo || line.date !== commonDate ||
          line.branch_id !== commonBranchId || line.addedby !== commonAddedBy) {
        await t.rollback();
        return res.status(400).json({ error: 'All transaction lines for a single journal entry must have the same transaction_no, date, branch_id, and addedby.' });
      }

      // Ensure that a line is either a debit or a credit, not both or neither
      if ((debit === undefined || debit === null) && (credit === undefined || credit === null)) {
        await t.rollback();
        return res.status(400).json({ error: `Transaction line for account ${account_id} must specify either a debit or a credit.` });
      }
      if ((debit !== undefined && debit > 0) && (credit !== undefined && credit > 0)) {
        await t.rollback();
        return res.status(400).json({ error: `Transaction line for account ${account_id} cannot be both a debit and a credit.` });
      }
      // Ensure the amount matches the debit/credit if only one is provided
      if (debit > 0 && parseFloat(debit) !== parseFloat(amount)) {
        await t.rollback();
        return res.status(400).json({ error: `Debit amount (${debit}) does not match total amount (${amount}) for account ${account_id}.` });
      }
      if (credit > 0 && parseFloat(credit) !== parseFloat(amount)) {
        await t.rollback();
        return res.status(400).json({ error: `Credit amount (${credit}) does not match total amount (${amount}) for account ${account_id}.` });
      }


      // Validate foreign key existence for each line
      const existingAccount = await ChartOfAccount.findByPk(account_id, { transaction: t });
      if (!existingAccount) {
        await t.rollback();
        return res.status(400).json({ error: `Invalid account_id (${account_id}) found in transaction line.` });
      }
      const existingUser = await User.findByPk(addedby, { transaction: t });
      if (!existingUser) {
        await t.rollback();
        return res.status(400).json({ error: `Invalid addedby user_id (${addedby}) found in transaction line.` });
      }
      const existingBranch = await Branch.findByPk(branch_id, { transaction: t });
      if (!existingBranch) {
        await t.rollback();
        return res.status(400).json({ error: `Invalid branch_id (${branch_id}) found in transaction line.` });
      }

      totalDebits += parseFloat(debit || 0);
      totalCredits += parseFloat(credit || 0);

      // Create the transaction line
      const newTransactionLine = await Transaction.create(line, { transaction: t });
      createdTransactions.push(newTransactionLine);
    }

    // Validate double-entry principle: Total Debits must equal Total Credits
    if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for small floating point inaccuracies
      await t.rollback();
      return res.status(400).json({ error: `Total debits (${totalDebits}) do not equal total credits (${totalCredits}) for transaction number ${commonTransactionNo}.` });
    }

    await t.commit();
    res.status(201).json(createdTransactions);

  } catch (error) {
    await t.rollback(); // Rollback in case of any unexpected error
    console.error('Error in createTransaction (Double-Entry):', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Updates a transaction by ID.
 * This endpoint will only allow updates for UNPOSTED transactions.
 */
exports.updateTransaction = async (req, res) => {
  try {
    const transaction_id = req.params.transaction_id;
    const transaction = await Transaction.findByPk(transaction_id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (transaction.is_posted) {
      return res.status(403).json({ error: 'Cannot directly update a posted transaction. Please create a reversal entry instead.' });
    }

    // Basic validation for debit/credit balance if present in update
    const { debit, credit, amount } = req.body;
    if ((debit !== undefined || credit !== undefined) && ((debit > 0 && credit > 0) || (debit === undefined && credit === undefined))) {
        return res.status(400).json({ error: 'Transaction line cannot be both a debit and a credit, or neither.' });
    }
    if (debit > 0 && parseFloat(debit) !== parseFloat(amount)) {
        return res.status(400).json({ error: `Debit amount (${debit}) does not match total amount (${amount}).` });
    }
    if (credit > 0 && parseFloat(credit) !== parseFloat(amount)) {
        return res.status(400).json({ error: `Credit amount (${credit}) does not match total amount (${amount}).` });
    }


    const [updated] = await Transaction.update(req.body, {
      where: { transaction_id: transaction_id }
    });

    if (updated) {
      const updatedTransaction = await Transaction.findByPk(transaction_id, {
        include: [
          { model: ChartOfAccount, as: 'account' },
          { model: User, as: 'createdBy', attributes: ['user_id', 'email', 'first_name', 'last_name'] },
          { model: Branch, as: 'branch' },
        ]
      });
      res.status(200).json(updatedTransaction);
    } else {
      // This path is less likely if the transaction exists and isn't posted
      res.status(400).json({ error: 'Failed to update transaction, or no changes provided.' });
    }
  } catch (error) {
    console.error('Error in updateTransaction:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

/**
 * Deletes a transaction by ID.
 * This endpoint will ONLY allow deletion of UNPOSTED transactions (e.g., drafts or errors before finalization).
 * For posted transactions, a reversal entry is the proper accounting method.
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction_id = req.params.transaction_id;
    const transaction = await Transaction.findByPk(transaction_id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (transaction.is_posted) {
      return res.status(403).json({ error: 'Cannot delete a posted transaction. Please use the reversal endpoint for auditability.' });
    }

    const deleted = await Transaction.destroy({
      where: { transaction_id: transaction_id }
    });

    if (deleted) {
      res.status(204).send(); // 204 No Content for successful deletion
    } else {
      // This path is less likely if the transaction exists and isn't posted
      res.status(400).json({ error: 'Failed to delete transaction.' });
    }
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Create a reversal transaction for a *complete journal entry* (identified by transaction_no)
exports.reverseTransaction = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { original_transaction_no, addedby, branch_id, reversal_date, description_suffix } = req.body;

    // Validate input for reversal
    if (!original_transaction_no || !addedby || !branch_id || !reversal_date) {
      await t.rollback();
      return res.status(400).json({ error: 'original_transaction_no, addedby, branch_id, and reversal_date are required for a full reversal.' });
    }

    // Find all original transaction lines for the given transaction_no
    const originalTransactions = await Transaction.findAll({
      where: { transaction_no: original_transaction_no },
      transaction: t
    });

    if (originalTransactions.length === 0) {
      await t.rollback();
      return res.status(404).json({ error: `No transactions found for original_transaction_no: ${original_transaction_no}.` });
    }

    // Check if any of the original transactions are already reversed or posted
    for (const originalTx of originalTransactions) {
      if (originalTx.is_posted) {
        // You might want to allow reversal of posted, but prevent double reversals
        // For now, we'll allow reversal of posted transactions, as is standard practice
      }
      if (originalTx.reversal_of_transaction_id) {
        await t.rollback();
        return res.status(400).json({ error: `Transaction line with ID ${originalTx.transaction_id} is already a reversal or has been reversed. Cannot reverse again.` });
      }
    }


    // Validate foreign keys for reversal
    const existingUser = await User.findByPk(addedby, { transaction: t });
    if (!existingUser) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid addedby user_id for reversal.' });
    }
    const existingBranch = await Branch.findByPk(branch_id, { transaction: t });
    if (!existingBranch) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid branch_id for reversal.' });
    }

    const newReversalTransactionNo = `REV-${original_transaction_no}-${Date.now()}`; // Unique number for the reversal journal entry
    const reversedTransactions = [];

    for (const originalTx of originalTransactions) {
      const reversedLine = {
        transaction_no: newReversalTransactionNo,
        transaction_type: 'Reversal', // Or a more specific enum for 'Correction' etc.
        account_id: originalTx.account_id,
        amount: originalTx.amount,
        date: reversal_date,
        description: `Reversal of original transaction ${original_transaction_no} - ${originalTx.description || ''}. ${description_suffix || ''}`,
        debit: originalTx.credit,   // Swap debit and credit
        credit: originalTx.debit,   // Swap credit and debit
        reference_no: original_transaction_no, // Reference the original JE number
        is_posted: true, // Reversals are typically immediately posted
        reversal_of_transaction_id: originalTx.transaction_id, // Link to the original line
        branch_id: branch_id,
        addedby: addedby
      };
      const createdReversedLine = await Transaction.create(reversedLine, { transaction: t });
      reversedTransactions.push(createdReversedLine);
    }

    // Optionally: Mark original transactions as 'reversed' if you add a status field to Transaction
    // , await Transaction.update({ status: 'Reversed' }, { where: { transaction_no: original_transaction_no }, transaction: t });

    await t.commit();
    res.status(201).json(reversedTransactions);

  } catch (error) {
    await t.rollback(); // Rollback in case of any unexpected error
    console.error('Error in reverseTransaction (Full Journal Entry):', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
