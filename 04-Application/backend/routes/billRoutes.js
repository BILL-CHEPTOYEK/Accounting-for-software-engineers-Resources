// /04-Application/backend/routes/billRoutes.js

const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

// Route to get all bills
router.get('/', billController.getAllBills);

// Route to get a single bill by ID
router.get('/:bill_id', billController.getBillById);

// Route to create a new bill
router.post('/', billController.createBill);

// Route to update a bill by ID
router.put('/:bill_id', billController.updateBill);

// Route to post a bill and generate transactions
router.post('/:bill_id/post', billController.postBill);

// Route to delete a bill by ID
router.delete('/:bill_id', billController.deleteBill);

module.exports = router;
