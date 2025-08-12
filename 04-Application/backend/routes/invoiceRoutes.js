// /04-Application/backend/routes/invoiceRoutes.js

const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController'); // Path to invoice controller

// Route to get all invoices
router.get('/', invoiceController.getAllInvoices);

// Route to get a single invoice by ID
router.get('/:invoice_id', invoiceController.getInvoiceById);

// Route to create a new invoice
router.post('/', invoiceController.createInvoice);

// Route to update an invoice by ID
router.put('/:invoice_id', invoiceController.updateInvoice);

// Route to delete an invoice by ID
router.delete('/:invoice_id', invoiceController.deleteInvoice);

module.exports = router;
