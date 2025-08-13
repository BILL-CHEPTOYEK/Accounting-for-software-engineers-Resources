// /04-Application/backend/frontend/src/components/InvoiceFormModal.jsx

import React, { useState, useEffect } from 'react';

function InvoiceFormModal({ show, onClose, onSubmit, invoice, parties }) {
  const [formData, setFormData] = useState({
    party_id: '',
    type: '', // Make sure this is an empty string for initial selection
    document_no: '',
    issue_date: '',
    due_date: '',
    total_amount: '',
    status: 'Draft', // Default status for new invoices
  });
  const [errors, setErrors] = useState({});

  // Effect to populate form data when 'invoice' prop changes (for editing)
  useEffect(() => {
    if (invoice) {
      setFormData({
        party_id: invoice.party_id || '',
        type: invoice.type || '',
        document_no: invoice.document_no || '',
        issue_date: invoice.issue_date || '',
        due_date: invoice.due_date || '',
        total_amount: parseFloat(invoice.total_amount) || '', // Ensure number
        status: invoice.status || 'Draft',
      });
    } else {
      // Reset form for adding new invoice
      setFormData({
        party_id: '',
        type: '',
        document_no: '',
        issue_date: '',
        due_date: '',
        total_amount: '',
        status: 'Draft',
      });
    }
    setErrors({}); // Clear errors when modal opens/changes context
  }, [invoice, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { party_id, type, document_no, issue_date, due_date, total_amount } = formData;

    if (!party_id) newErrors.party_id = 'Party is required.';
    if (!type) newErrors.type = 'Invoice Type is required.';
    if (!document_no.trim()) newErrors.document_no = 'Document Number is required.';
    if (!issue_date) newErrors.issue_date = 'Issue Date is required.';
    if (!due_date) newErrors.due_date = 'Due Date is required.';
    
    // Validate total_amount
    const amountNum = parseFloat(total_amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.total_amount = 'Total Amount must be a positive number.';
    }

    // Validate dates
    if (issue_date && due_date) {
      const issue = new Date(issue_date);
      const due = new Date(due_date);
      if (issue > due) {
        newErrors.due_date = 'Due Date cannot be before Issue Date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        total_amount: parseFloat(formData.total_amount), // Ensure amount is a number
      });
    }
  };

  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header bg-warning text-white"> {/* Using warning for form header */}
            <h5 className="modal-title">{invoice ? 'Edit Invoice' : 'Create New Invoice'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Party Selection */}
              <div className="mb-3">
                <label htmlFor="party_id" className="form-label">Party</label>
                <select
                  className={`form-select ${errors.party_id ? 'is-invalid' : ''}`}
                  id="party_id"
                  name="party_id"
                  value={formData.party_id}
                  onChange={handleChange}
                >
                  <option value="">Select a Party</option>
                  {parties.map(p => (
                    <option key={p.party_id} value={p.party_id}>
                      {p.first_name} {p.last_name} ({p.party_type})
                    </option>
                  ))}
                </select>
                {errors.party_id && <div className="invalid-feedback">{errors.party_id}</div>}
              </div>

              {/* Invoice Type */}
              <div className="mb-3">
                <label htmlFor="type" className="form-label">Invoice Type</label>
                <select
                  className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="">Select Type</option>
                  <option value="Pro forma">Pro forma</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Quotation">Quotation</option>
                </select>
                {errors.type && <div className="invalid-feedback">{errors.type}</div>}
              </div>

              {/* Document Number */}
              <div className="mb-3">
                <label htmlFor="document_no" className="form-label">Document Number</label>
                <input
                  type="text"
                  className={`form-control ${errors.document_no ? 'is-invalid' : ''}`}
                  id="document_no"
                  name="document_no"
                  value={formData.document_no}
                  onChange={handleChange}
                />
                {errors.document_no && <div className="invalid-feedback">{errors.document_no}</div>}
              </div>

              {/* Issue Date */}
              <div className="mb-3">
                <label htmlFor="issue_date" className="form-label">Issue Date</label>
                <input
                  type="date"
                  className={`form-control ${errors.issue_date ? 'is-invalid' : ''}`}
                  id="issue_date"
                  name="issue_date"
                  value={formData.issue_date}
                  onChange={handleChange}
                />
                {errors.issue_date && <div className="invalid-feedback">{errors.issue_date}</div>}
              </div>

              {/* Due Date */}
              <div className="mb-3">
                <label htmlFor="due_date" className="form-label">Due Date</label>
                <input
                  type="date"
                  className={`form-control ${errors.due_date ? 'is-invalid' : ''}`}
                  id="due_date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                />
                {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
              </div>

              {/* Total Amount */}
              <div className="mb-3">
                <label htmlFor="total_amount" className="form-label">Total Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.total_amount ? 'is-invalid' : ''}`}
                  id="total_amount"
                  name="total_amount"
                  value={formData.total_amount}
                  onChange={handleChange}
                />
                {errors.total_amount && <div className="invalid-feedback">{errors.total_amount}</div>}
              </div>

              {/* Status (for editing, might not be shown for new) */}
              {invoice && ( // Only show status dropdown if editing an existing invoice
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Received">Received</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn btn-primary">
                Save Invoice
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InvoiceFormModal;
