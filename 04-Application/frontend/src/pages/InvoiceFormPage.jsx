// /04-Application/backend/frontend/src/pages/InvoiceFormPage.jsx

import React, { useState, useEffect } from 'react';
import { invoiceApi, partyApi, userApi, branchApi, chartOfAccountApi } from '../services/api'; 

function InvoiceFormPage({ setCurrentPage, invoiceToEdit }) {
  const isEditMode = !!invoiceToEdit;

  // Initial state for the invoice form
  const initialInvoiceState = {
    party_id: '',
    type: 'Commercial', // Default invoice type
    document_no: '',
    issue_date: new Date().toISOString().split('T')[0], // Default to today's date
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default
    total_amount: '0.00', // Calculated from line items
    status: 'Draft', // Default status
    lineItems: [
      { description: '', quantity: '1', unit_price: '0.00', line_total_amount: '0.00', account_id: '' }, // Added account_id
    ], // Start with just one line for a cleaner look
    // For posting: (will be sent to the /post endpoint)
    payment_method: 'Credit', // Default payment method for new invoices
    addedby: '', // Will be auto-filled by logged-in user later
    branch_id: '', // Will be auto-filled by logged-in user's branch later
  };

  const [invoice, setInvoice] = useState(initialInvoiceState);
  const [parties, setParties] = useState([]); // All parties
  const [customerParties, setCustomerParties] = useState([]); // Filtered customers for dropdown
  const [users, setUsers] = useState([]); // For addedby
  const [branches, setBranches] = useState([]); // For branch_id
  const [revenueAccounts, setRevenueAccounts] = useState([]); // Filtered revenue accounts for line items
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [lineItemRemovalError, setLineItemRemovalError] = useState(null); // New state for line item removal errors

  // Fetch lookup data (parties, users, branches, accounts) on component mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        setLookupError(null);
        const [partiesRes, usersRes, branchesRes, accountsRes] = await Promise.all([
          partyApi.getAllParties(),
          userApi.getAllUsers(),
          branchApi.getAllBranches(),
          chartOfAccountApi.getAllChartOfAccounts(), // Fetch all accounts
        ]);

        setParties(partiesRes.data);
        const filteredCustomers = partiesRes.data.filter(party => party.party_type === 'Customer');
        setCustomerParties(filteredCustomers);

        setUsers(usersRes.data);
        setBranches(branchesRes.data);

        // Filter for Revenue accounts for invoice line items
        const filteredRevenueAccounts = accountsRes.data.filter(
          account => account.accountType && account.accountType.category === 'Revenue'
        );
        setRevenueAccounts(filteredRevenueAccounts);

        // Set initial defaults for addedby and branch_id for NEW entries
        if (!isEditMode) {
            setInvoice(prev => ({
                ...prev,
                addedby: usersRes.data.length > 0 ? usersRes.data[0].user_id : '',
                branch_id: branchesRes.data.length > 0 ? branchesRes.data[0].branch_id : '',
            }));
        }

      } catch (err) {
        console.error('Failed to fetch lookup data:', err);
        setLookupError('Failed to load necessary data (parties, users, branches, accounts). Please check your backend.');
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, [isEditMode]);

  // Effect to populate form data when 'invoiceToEdit' prop changes (for editing)
  useEffect(() => {
    if (isEditMode && invoiceToEdit) {
      const loadedLineItems = invoiceToEdit.lineItems ? invoiceToEdit.lineItems.map(item => ({
        ...item,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
        line_total_amount: String(item.line_total_amount),
        account_id: item.account_id || '', // Ensure account_id is loaded
      })) : [];

      setInvoice({
        party_id: invoiceToEdit.party_id || '',
        type: invoiceToEdit.type || 'Commercial',
        document_no: invoiceToEdit.document_no || '',
        issue_date: invoiceToEdit.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoiceToEdit.due_date || new Date().toISOString().split('T')[0],
        total_amount: String(invoiceToEdit.total_amount) || '0.00',
        status: invoiceToEdit.status || 'Draft',
        lineItems: loadedLineItems.length > 0 ? loadedLineItems : initialInvoiceState.lineItems,
        payment_method: invoiceToEdit.payment_method || 'Credit',
        addedby: invoiceToEdit.addedby || (users.length > 0 ? users[0].user_id : ''),
        branch_id: invoiceToEdit.branch_id || (branches.length > 0 ? branches[0].branch_id : ''),
      });
    } else if (!isEditMode && customerParties.length > 0 && users.length > 0 && branches.length > 0 && revenueAccounts.length > 0) {
      // Reset to initial state for new invoice if not in edit mode
      setInvoice(prev => ({
        ...initialInvoiceState,
        addedby: users.length > 0 ? users[0].user_id : '',
        branch_id: branches.length > 0 ? branches[0].branch_id : '',
      }));
    }
    setErrors({}); // Clear errors when mode changes
    setLineItemRemovalError(null); // Clear removal error
  }, [invoiceToEdit, isEditMode, customerParties, users, branches, revenueAccounts]); // Depend on customerParties, users, branches, revenueAccounts

  // Calculate total amount whenever line items change
  useEffect(() => {
    const calculatedTotal = invoice.lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
    setInvoice(prev => ({
      ...prev,
      total_amount: calculatedTotal.toFixed(2)
    }));
  }, [invoice.lineItems]);

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleLineItemChange = (index, e) => {
    const { name, value } = e.target;
    const newLineItems = [...invoice.lineItems];
    newLineItems[index][name] = value;

    // Recalculate line total instantly
    const qty = parseFloat(newLineItems[index].quantity) || 0;
    const price = parseFloat(newLineItems[index].unit_price) || 0;
    newLineItems[index].line_total_amount = (qty * price).toFixed(2);

    setInvoice(prev => ({
      ...prev,
      lineItems: newLineItems
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
    setLineItemRemovalError(null); // Clear removal error when line item changes
  };

  const handleAddLineItem = () => {
    setInvoice(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { description: '', quantity: '1', unit_price: '0.00', line_total_amount: '0.00', account_id: '' } // Added account_id
      ]
    }));
    setLineItemRemovalError(null); // Clear removal error
  };

  const handleRemoveLineItem = (index) => {
    if (invoice.lineItems.length <= 1) {
      // Display custom error message instead of alert
      setLineItemRemovalError('An invoice must have at least one line item.');
      return;
    }
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
    setLineItemRemovalError(null); // Clear removal error on successful removal
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!invoice.party_id) newErrors.party_id = 'Party is required.';
    if (!invoice.document_no.trim()) newErrors.document_no = 'Document Number is required.';
    if (!invoice.issue_date) {
        newErrors.issue_date = 'Issue Date is required.';
    } else if (invoice.issue_date > today) {
        newErrors.issue_date = 'Issue Date cannot be in the future.';
    }
    if (!invoice.due_date) {
        newErrors.due_date = 'Due Date is required.';
    } else if (invoice.due_date < invoice.issue_date) {
        newErrors.due_date = 'Due Date cannot be before Issue Date.';
    }
    if (parseFloat(invoice.total_amount) <= 0) {
      newErrors.total_amount = 'Total amount must be greater than zero.';
    }

    const lineErrors = invoice.lineItems.map((line, index) => {
      const lineSpecificErrors = {};
      if (!line.description.trim()) lineSpecificErrors.description = 'Description is required.';
      if (isNaN(parseFloat(line.quantity)) || parseFloat(line.quantity) <= 0) {
        lineSpecificErrors.quantity = 'Quantity must be a positive number.';
      }
      if (isNaN(parseFloat(line.unit_price)) || parseFloat(line.unit_price) < 0) {
        lineSpecificErrors.unit_price = 'Unit Price must be a non-negative number.';
      }
      if (!line.account_id) { // Validate account_id for each line
        lineSpecificErrors.account_id = 'Account is required.';
      }
      return Object.keys(lineSpecificErrors).length > 0 ? lineSpecificErrors : null;
    });

    if (lineErrors.some(err => err !== null)) {
      newErrors.lineItems = lineErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !newErrors.lineItems;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setLineItemRemovalError(null); // Clear line item error on submit attempt

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Prepare data for submission: remove payment_method, addedby, branch_id as they are for posting
    const { payment_method, addedby, branch_id, ...invoiceToSave } = invoice;
    // Remove invoice_line_id for new items as backend creates them. Keep for existing to update.
    invoiceToSave.lineItems = invoiceToSave.lineItems.map(item => {
        if (item.invoice_line_id && isEditMode) { // Only send ID for existing items in edit mode
            return { invoice_line_id: item.invoice_line_id, ...item };
        }
        const { invoice_line_id, ...rest } = item; // Destructure to remove ID for new items
        return rest;
    });


    try {
      if (isEditMode) {
        // Prevent editing if already posted
        if (invoiceToEdit.status.startsWith('Posted_')) {
          setSubmitError('Cannot edit a posted invoice. Create a new invoice or a credit note instead.');
          return;
        }
        await invoiceApi.updateInvoice(invoiceToEdit.invoice_id, invoiceToSave);
      } else {
        await invoiceApi.createInvoice(invoiceToSave);
      }
      setSubmitSuccess(true);
      // Navigate back to invoices list after success
      setTimeout(() => setCurrentPage('invoices', null), 1500);
    } catch (err) {
      console.error('Error saving invoice:', err);
      setSubmitError('Failed to save invoice: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loadingLookups) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-info">Loading necessary data (parties, users, branches, accounts)...</p>
      </div>
    );
  }

  if (lookupError) {
    return (
      <div className="alert alert-danger text-center" role="alert">
        {lookupError}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="h3 fw-semibold text-dark mb-4 d-flex justify-content-between align-items-center">
        <span><i className="bi bi-receipt-cutoff me-2 text-danger"></i> {isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</span>
        <button className="btn btn-secondary shadow-sm" onClick={() => setCurrentPage('invoices', null)}>
          <i className="bi bi-arrow-left-circle me-2"></i> Back to Invoices List
        </button>
      </h2>

      {submitSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> Invoice {isEditMode ? 'updated' : 'created'} successfully!
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setSubmitSuccess(false)}></button>
        </div>
      )}

      {submitError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {submitError}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setSubmitError(false)}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Invoice Details Card - Optimized UI */}
        <div className="card shadow-sm p-4 mb-4">
          <h5 className="card-title text-danger mb-3">Invoice Details</h5>
          <div className="row row-cols-1 row-cols-md-2 g-3 mb-2">
            {/* Party (Customer) */}
            <div className="col">
              <label htmlFor="party_id" className="form-label mb-1">Party (Customer) <span className="text-danger">*</span></label>
              <select
                className={`form-select form-select-sm ${errors.party_id ? 'is-invalid' : ''}`}
                id="party_id"
                name="party_id"
                value={invoice.party_id}
                onChange={handleInvoiceChange}
                disabled={isEditMode && invoice.status.startsWith('Posted_')}
              >
                <option value="">Select Customer</option>
                {customerParties.map(party => (
                  <option key={party.party_id} value={party.party_id}>
                    {party.first_name} {party.last_name}
                  </option>
                ))}
              </select>
              {errors.party_id && <div className="invalid-feedback">{errors.party_id}</div>}
            </div>
            {/* Document Number */}
            <div className="col">
              <label htmlFor="document_no" className="form-label mb-1">Document Number <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control form-control-sm ${errors.document_no ? 'is-invalid' : ''}`}
                id="document_no"
                name="document_no"
                value={invoice.document_no}
                onChange={handleInvoiceChange}
                placeholder="e.g., INV-2024-001"
                readOnly={isEditMode && invoice.status.startsWith('Posted_')}
              />
              {errors.document_no && <div className="invalid-feedback">{errors.document_no}</div>}
            </div>
          </div>

          <div className="row row-cols-1 row-cols-md-3 g-3 mb-3">
            {/* Invoice Type */}
            <div className="col">
              <label htmlFor="type" className="form-label mb-1">Invoice Type</label>
              <select
                className="form-select form-select-sm"
                id="type"
                name="type"
                value={invoice.type}
                onChange={handleInvoiceChange}
                disabled={isEditMode && invoice.status.startsWith('Posted_')}
              >
                <option value="Commercial">Commercial</option>
                <option value="Pro forma">Pro forma</option>
                <option value="Quotation">Quotation</option>
              </select>
            </div>
            {/* Issue Date */}
            <div className="col">
              <label htmlFor="issue_date" className="form-label mb-1">Issue Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className={`form-control form-control-sm ${errors.issue_date ? 'is-invalid' : ''}`}
                id="issue_date"
                name="issue_date"
                value={invoice.issue_date}
                onChange={handleInvoiceChange}
                readOnly={isEditMode && invoice.status.startsWith('Posted_')}
              />
              {errors.issue_date && <div className="invalid-feedback">{errors.issue_date}</div>}
            </div>
            {/* Due Date */}
            <div className="col">
              <label htmlFor="due_date" className="form-label mb-1">Due Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className={`form-control form-control-sm ${errors.due_date ? 'is-invalid' : ''}`}
                id="due_date"
                name="due_date"
                value={invoice.due_date}
                onChange={handleInvoiceChange}
                readOnly={isEditMode && invoice.status.startsWith('Posted_')}
              />
              {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
            </div>
          </div>

          {/* Hidden fields for backend use in posting - will be pre-filled later by auth */}
          <input type="hidden" name="addedby" value={invoice.addedby} />
          <input type="hidden" name="branch_id" value={invoice.branch_id} />

          {/* Display current status and total amount (read-only) - More compact */}
          <div className="row g-2 mt-2 align-items-center">
            <div className="col-md-6">
              <div className="alert alert-light border text-muted py-1 px-2 mb-0">
                Status: <span className="fw-bold text-primary">{invoice.status}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className={`alert text-end py-1 px-2 mb-0 ${parseFloat(invoice.total_amount) <= 0 ? 'alert-warning' : 'alert-info'}`}>
                <h5 className="mb-0">Total: <span className="fw-bold">${invoice.total_amount}</span></h5>
                {errors.total_amount && <div className="text-danger small">{errors.total_amount}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Line Items Card - Refined UI */}
        <div className="card shadow-sm p-4 mb-4">
          <h5 className="card-title text-danger mb-3">Line Items <span className="text-danger">*</span></h5>
          {isEditMode && invoice.status.startsWith('Posted_') && (
            <div className="alert alert-warning mb-3">
              <i className="bi bi-info-circle me-2"></i> Line items cannot be modified for a posted invoice.
            </div>
          )}

          {lineItemRemovalError && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {lineItemRemovalError}
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setLineItemRemovalError(null)}></button>
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-sm table-borderless align-middle mb-0">
              <thead>
                <tr className="text-muted small border-bottom">
                  <th style={{ width: '30%' }}>Description</th>
                  <th style={{ width: '25%' }}>Account</th>
                  <th style={{ width: '10%' }} className="text-end">Qty</th>
                  <th style={{ width: '15%' }} className="text-end">Unit Price</th>
                  <th style={{ width: '10%' }} className="text-end">Total</th>
                  <th style={{ width: '10%' }} className="text-center"></th> {/* For remove button */}
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={item.invoice_line_id || `new-line-${index}`} className="border-bottom">
                    {/* Description */}
                    <td>
                      <input
                        type="text"
                        className={`form-control form-control-sm ${errors.lineItems?.[index]?.description ? 'is-invalid' : ''}`}
                        name="description"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, e)}
                        placeholder="Item or service"
                        readOnly={isEditMode && invoice.status.startsWith('Posted_')}
                      />
                      {errors.lineItems?.[index]?.description && <div className="invalid-feedback">{errors.lineItems[index].description}</div>}
                    </td>
                    {/* Account Selection */}
                    <td>
                      <select
                        className={`form-select form-select-sm ${errors.lineItems?.[index]?.account_id ? 'is-invalid' : ''}`}
                        name="account_id"
                        value={item.account_id}
                        onChange={(e) => handleLineItemChange(index, e)}
                        disabled={isEditMode && invoice.status.startsWith('Posted_')}
                      >
                        <option value="">Select Account</option>
                        {revenueAccounts.map(account => (
                          <option key={account.account_id} value={account.account_id}>
                            {account.account_no} - {account.name}
                          </option>
                        ))}
                      </select>
                      {errors.lineItems?.[index]?.account_id && <div className="invalid-feedback">{errors.lineItems[index].account_id}</div>}
                    </td>
                    {/* Quantity */}
                    <td className="w-auto">
                      <input
                        type="number"
                        step="0.01"
                        className={`form-control form-control-sm text-end ${errors.lineItems?.[index]?.quantity ? 'is-invalid' : ''}`}
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, e)}
                        min="0.01"
                        readOnly={isEditMode && invoice.status.startsWith('Posted_')}
                      />
                      {errors.lineItems?.[index]?.quantity && <div className="invalid-feedback">{errors.lineItems[index].quantity}</div>}
                    </td>
                    {/* Unit Price */}
                    <td className="w-auto">
                      <input
                        type="number"
                        step="0.01"
                        className={`form-control form-control-sm text-end ${errors.lineItems?.[index]?.unit_price ? 'is-invalid' : ''}`}
                        name="unit_price"
                        value={item.unit_price}
                        onChange={(e) => handleLineItemChange(index, e)}
                        min="0"
                        readOnly={isEditMode && invoice.status.startsWith('Posted_')}
                      />
                      {errors.lineItems?.[index]?.unit_price && <div className="invalid-feedback">{errors.lineItems[index].unit_price}</div>}
                    </td>
                    {/* Line Total (Read-only) */}
                    <td className="text-end fw-bold text-nowrap w-auto">
                      ${parseFloat(item.line_total_amount).toFixed(2)}
                    </td>
                    {/* Remove Button */}
                    <td className="text-center w-auto">
                      {(!isEditMode || !invoice.status.startsWith('Posted_')) && (
                        <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={() => handleRemoveLineItem(index)} title="Remove Line Item">
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!isEditMode || !invoice.status.startsWith('Posted_')) && (
            <button type="button" className="btn btn-outline-secondary w-100 mt-3" onClick={handleAddLineItem}>
              <i className="bi bi-plus-circle me-2"></i> Add Another Line Item
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('invoices', null)}>
            Cancel
          </button>
          {(!isEditMode || !invoice.status.startsWith('Posted_')) && (
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-save me-2"></i> {isEditMode ? 'Save Changes' : 'Create Invoice'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default InvoiceFormPage;
