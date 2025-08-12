// /04-Application/backend/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Route to get all transactions
router.get('/', transactionController.getAllTransactions);

// Route to get a single transaction by ID
router.get('/:transaction_id', transactionController.getTransactionById);

// Route to create a new transaction (Journal Entry)
router.post('/', transactionController.createTransaction);

// Route to update a transaction by ID (only for unposted transactions)
router.put('/:transaction_id', transactionController.updateTransaction);

// Route to delete a transaction by ID (only for unposted transactions)
router.delete('/:transaction_id', transactionController.deleteTransaction);

// Route to create a reversal transaction for a *complete journal entry*
// It expects 'original_transaction_no' in the request body.
router.post('/reverse', transactionController.reverseTransaction);

module.exports = router;
