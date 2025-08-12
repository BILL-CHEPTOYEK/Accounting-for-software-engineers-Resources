// /04-Application/backend/controllers/invoiceController.js

const db = require('../models'); // Path from controllers to models
const Invoice = db.Invoice;     // Access the Invoice model

// Get all invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll();
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error in getAllInvoices:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Get a single invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.invoice_id);
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

// Create a new invoice
exports.createInvoice = async (req, res) => {
  try {
    const newInvoice = await Invoice.create(req.body);
    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Error in createInvoice:', error);
    res.status(400).json({ error: error.message || 'Bad Request' }); // 400 for validation errors
  }
};

// Update an invoice by ID
exports.updateInvoice = async (req, res) => {
  try {
    const [updated] = await Invoice.update(req.body, {
      where: { invoice_id: req.params.invoice_id }
    });
    if (updated) {
      const updatedInvoice = await Invoice.findByPk(req.params.invoice_id);
      res.status(200).json(updatedInvoice);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error in updateInvoice:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

// Delete an invoice by ID
exports.deleteInvoice = async (req, res) => {
  try {
    const deleted = await Invoice.destroy({
      where: { invoice_id: req.params.invoice_id }
    });
    if (deleted) {
      res.status(204).send(); // 204 No Content for successful deletion
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error in deleteInvoice:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
