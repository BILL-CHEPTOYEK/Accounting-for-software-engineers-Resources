// /04-Application/backend/frontend/src/pages/BillFormPage.jsx

import React, { useState, useEffect } from 'react';
import { billApi, partyApi, chartOfAccountApi } from '../services/api'; // Corrected import path

function BillFormPage({ setCurrentPage, billToEdit }) {
  const isEditMode = !!billToEdit;

  // Initial state for the bill form
  const initialBillState = {
    party_id: '',
    document_no: '',
    issue_date: new Date().toISOString().split('T')[0], // Default to today's date
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default to 30 days from now
    total_amount: '0.00', // Calculated from line items
    status: 'Draft', // Default status
    lineItems: [
      { description: '', quantity: '1', unit_price: '0.00', line_total_amount: '0.00', account_id: '' },
      { description: '', quantity: '1', unit_price: '0.00', line_total_amount: '0.00', account_id: '' },
    ],
  };

  const [bill, setBill] = useState(initialBillState);
  const [supplierParties, setSupplierParties] = useState([]); // Filtered suppliers for dropdown
  const [expenseAssetAccounts, setExpenseAssetAccounts] = useState([]); // Filtered expense/asset accounts for line items
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch lookup data (parties, accounts) on component mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        setLookupError(null);
        const [partiesRes, accountsRes] = await Promise.all([
          partyApi.getAllParties(),
          chartOfAccountApi.getAllChartOfAccounts(),
        ]);

        const filteredSuppliers = partiesRes.data.filter(party => party.party_type === 'Supplier');
        setSupplierParties(filteredSuppliers);

        // Filter for Expense and Asset accounts for line items
        const filteredAccounts = accountsRes.data.filter(
          account => account.accountType && (
            account.accountType.category === 'Expense' ||
            account.accountType.category === 'Asset'
          )
        );
        setExpenseAssetAccounts(filteredAccounts);

      } catch (err) {
        console.error('Failed to fetch lookup data:', err);
        setLookupError('Failed to load necessary data (suppliers, accounts). Please check your backend.');
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, [isEditMode]);

  // Effect to populate form data when 'billToEdit' prop changes (for editing)
  useEffect(() => {
    if (isEditMode && billToEdit) {
      // Deep copy lineItems to ensure state independence
      const loadedLineItems = billToEdit.lineItems ? billToEdit.lineItems.map(item => ({
        ...item,
        quantity: String(item.quantity), // Convert to string for input value
        unit_price: String(item.unit_price),
        line_total_amount: String(item.line_total_amount)
      })) : [];

      setBill({
        party_id: billToEdit.party_id || '',
        document_no: billToEdit.document_no || '',
        issue_date: billToEdit.issue_date || new Date().toISOString().split('T')[0],
        due_date: billToEdit.due_date || new Date().toISOString().split('T')[0],
        total_amount: String(billToEdit.total_amount) || '0.00',
        status: billToEdit.status || 'Draft',
        lineItems: loadedLineItems.length > 0 ? loadedLineItems : initialBillState.lineItems,
      });
    } else if (!isEditMode && supplierParties.length > 0 && expenseAssetAccounts.length > 0) {
      // Reset to initial state for new bill if not in edit mode
      // and lookup data is available
      setBill(initialBillState);
    }
    setErrors({}); // Clear errors when mode changes
  }, [billToEdit, isEditMode, supplierParties, expenseAssetAccounts]);

  // Calculate total amount whenever line items change
  useEffect(() => {
    const calculatedTotal = bill.lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
    setBill(prev => ({
      ...prev,
      total_amount: calculatedTotal.toFixed(2)
    }));
  }, [bill.lineItems]);

  const handleBillChange = (e) => {
    const { name, value } = e.target;
    setBill(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleLineItemChange = (index, e) => {
    const { name, value } = e.target;
    const newLineItems = [...bill.lineItems];
    newLineItems[index][name] = value;

    // Recalculate line total instantly
    const qty = parseFloat(newLineItems[index].quantity) || 0;
    const price = parseFloat(newLineItems[index].unit_price) || 0;
    newLineItems[index].line_total_amount = (qty * price).toFixed(2);

    setBill(prev => ({
      ...prev,
      lineItems: newLineItems
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleAddLineItem = () => {
    setBill(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { description: '', quantity: '1', unit_price: '0.00', line_total_amount: '0.00', account_id: '' }
      ]
    }));
  };

  const handleRemoveLineItem = (index) => {
    if (bill.lineItems.length <= 1) {
      alert('A bill must have at least one line item.');
      return;
    }
    setBill(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!bill.party_id) newErrors.party_id = 'Supplier is required.';
    if (!bill.document_no.trim()) newErrors.document_no = 'Document Number is required.';
    if (!bill.issue_date) {
        newErrors.issue_date = 'Issue Date is required.';
    } else if (bill.issue_date > today) {
        newErrors.issue_date = 'Issue Date cannot be in the future.';
    }
    if (!bill.due_date) {
        newErrors.due_date = 'Due Date is required.';
    } else if (bill.due_date < bill.issue_date) {
        newErrors.due_date = 'Due Date cannot be before Issue Date.';
    }
    if (parseFloat(bill.total_amount) <= 0) {
      newErrors.total_amount = 'Total amount must be greater than zero.';
    }

    const lineErrors = bill.lineItems.map((line, index) => {
      const lineSpecificErrors = {};
      if (!line.description.trim()) lineSpecificErrors.description = 'Description is required.';
      if (isNaN(parseFloat(line.quantity)) || parseFloat(line.quantity) <= 0) {
        lineSpecificErrors.quantity = 'Quantity must be a positive number.';
      }
      if (isNaN(parseFloat(line.unit_price)) || parseFloat(line.unit_price) < 0) {
        lineSpecificErrors.unit_price = 'Unit Price must be a non-negative number.';
      }
      if (!line.account_id) { // NEW: Validate account_id for each line
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

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Prepare data for submission
    // Remove bill_line_id for new items as backend creates them. Keep for existing to update.
    const billToSave = { ...bill };
    billToSave.lineItems = billToSave.lineItems.map(item => {
        if (item.bill_line_id && isEditMode) { // Only send ID for existing items in edit mode
            return { bill_line_id: item.bill_line_id, ...item };
        }
        const { bill_line_id, ...rest } = item; // Destructure to remove ID for new items
        return rest;
    });

    try {
      if (isEditMode) {
        // Prevent editing if already approved/paid/cancelled
        if (billToEdit.status === 'Approved' || billToEdit.status === 'Paid' || billToEdit.status === 'Cancelled') {
          setSubmitError(`Cannot edit a bill with status '${billToEdit.status}'.`);
          return;
        }
        await billApi.updateBill(billToEdit.bill_id, billToSave);
      } else {
        await billApi.createBill(billToSave);
      }
      setSubmitSuccess(true);
      // Navigate back to bills list after success
      setTimeout(() => setCurrentPage('bills', null), 1500);
    } catch (err) {
      console.error('Error saving bill:', err);
      setSubmitError('Failed to save bill: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loadingLookups) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary">Loading necessary data (suppliers, accounts)...</p>
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
        <span><i className="bi bi-wallet-fill me-2 text-primary"></i> {isEditMode ? 'Edit Bill' : 'Record New Bill'}</span>
        <button className="btn btn-secondary shadow-sm" onClick={() => setCurrentPage('bills', null)}>
          <i className="bi bi-arrow-left-circle me-2"></i> Back to Bills List
        </button>
      </h2>

      {submitSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> Bill {isEditMode ? 'updated' : 'recorded'} successfully!
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
        {/* Bill Details Card */}
        <div className="card shadow-sm p-4 mb-4">
          <h5 className="card-title text-primary mb-3">Bill Details</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="party_id" className="form-label">Supplier <span className="text-danger">*</span></label>
              <select
                className={`form-select ${errors.party_id ? 'is-invalid' : ''}`}
                id="party_id"
                name="party_id"
                value={bill.party_id}
                onChange={handleBillChange}
                disabled={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
              >
                <option value="">Select Supplier</option>
                {supplierParties.map(party => (
                  <option key={party.party_id} value={party.party_id}>
                    {party.first_name} {party.last_name}
                  </option>
                ))}
              </select>
              {errors.party_id && <div className="invalid-feedback">{errors.party_id}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="document_no" className="form-label">Document Number (from Supplier) <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.document_no ? 'is-invalid' : ''}`}
                id="document_no"
                name="document_no"
                value={bill.document_no}
                onChange={handleBillChange}
                placeholder="e.g., VENDOR-INV-12345"
                readOnly={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
              />
              {errors.document_no && <div className="invalid-feedback">{errors.document_no}</div>}
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="issue_date" className="form-label">Issue Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className={`form-control ${errors.issue_date ? 'is-invalid' : ''}`}
                id="issue_date"
                name="issue_date"
                value={bill.issue_date}
                onChange={handleBillChange}
                readOnly={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
              />
              {errors.issue_date && <div className="invalid-feedback">{errors.issue_date}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="due_date" className="form-label">Due Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className={`form-control ${errors.due_date ? 'is-invalid' : ''}`}
                id="due_date"
                name="due_date"
                value={bill.due_date}
                onChange={handleBillChange}
                readOnly={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
              />
              {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
            </div>
          </div>

          {/* Display current status and total amount (read-only) */}
          <div className="row mt-3">
            <div className="col-md-6">
              <div className="alert alert-light border text-muted py-2 px-3">
                Current Status: <span className="fw-bold text-primary">{bill.status}</span>
              </div>
            </div>
            <div className="col-md-6">
              <div className={`alert text-end py-2 px-3 ${parseFloat(bill.total_amount) <= 0 ? 'alert-warning' : 'alert-info'}`}>
                <h4 className="mb-0">Total Amount: <span className="fw-bold">${bill.total_amount}</span></h4>
                {errors.total_amount && <div className="text-danger small">{errors.total_amount}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Bill Line Items Card */}
        <div className="card shadow-sm p-4 mb-4">
          <h5 className="card-title text-primary mb-3">Line Items <span className="text-danger">*</span></h5>
          {isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled') && (
            <div className="alert alert-warning mb-3">
              <i className="bi bi-info-circle me-2"></i> Line items cannot be modified for an approved, paid, or cancelled bill.
            </div>
          )}
          {bill.lineItems.map((item, index) => (
            <div key={item.bill_line_id || `new-line-${index}`} className="card mb-3 p-3 border">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">Item {index + 1}</h6>
                {(!isEditMode || !(bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')) && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveLineItem(index)}>
                    <i className="bi bi-x-circle me-1"></i> Remove
                  </button>
                )}
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor={`description_${index}`} className="form-label">Description <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.lineItems?.[index]?.description ? 'is-invalid' : ''}`}
                    id={`description_${index}`}
                    name="description"
                    value={item.description}
                    onChange={(e) => handleLineItemChange(index, e)}
                    placeholder="e.g., Office Supplies, Consulting Fee"
                    readOnly={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
                  />
                  {errors.lineItems?.[index]?.description && <div className="invalid-feedback">{errors.lineItems[index].description}</div>}
                </div>
                <div className="col-md-6">
                  <label htmlFor={`account_id_${index}`} className="form-label">Expense/Asset Account <span className="text-danger">*</span></label>
                  <select
                    className={`form-select ${errors.lineItems?.[index]?.account_id ? 'is-invalid' : ''}`}
                    id={`account_id_${index}`}
                    name="account_id"
                    value={item.account_id}
                    onChange={(e) => handleLineItemChange(index, e)}
                    disabled={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
                  >
                    <option value="">Select Account</option>
                    {expenseAssetAccounts.map(account => (
                      <option key={account.account_id} value={account.account_id}>
                        {account.account_no} - {account.name} ({account.accountType?.category})
                      </option>
                    ))}
                  </select>
                  {errors.lineItems?.[index]?.account_id && <div className="invalid-feedback">{errors.lineItems[index].account_id}</div>}
                </div>
                <div className="col-md-3">
                  <label htmlFor={`quantity_${index}`} className="form-label">Quantity <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${errors.lineItems?.[index]?.quantity ? 'is-invalid' : ''}`}
                    id={`quantity_${index}`}
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, e)}
                    min="0.01"
                    readOnly={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
                  />
                  {errors.lineItems?.[index]?.quantity && <div className="invalid-feedback">{errors.lineItems[index].quantity}</div>}
                </div>
                <div className="col-md-3">
                  <label htmlFor={`unit_price_${index}`} className="form-label">Unit Price <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    className={`form-control ${errors.lineItems?.[index]?.unit_price ? 'is-invalid' : ''}`}
                    id={`unit_price_${index}`}
                    name="unit_price"
                    value={item.unit_price}
                    onChange={(e) => handleLineItemChange(index, e)}
                    min="0"
                    readOnly={isEditMode && (bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')}
                  />
                  {errors.lineItems?.[index]?.unit_price && <div className="invalid-feedback">{errors.lineItems[index].unit_price}</div>}
                </div>
                <div className="col-12">
                  <div className="alert alert-light text-end py-2 px-3 mb-0">
                    Line Total: <span className="fw-bold">${item.line_total_amount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {(!isEditMode || !(bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')) && (
            <button type="button" className="btn btn-outline-secondary w-100 mt-3" onClick={handleAddLineItem}>
              <i className="bi bi-plus-circle me-2"></i> Add Another Line Item
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('bills', null)}>
            Cancel
          </button>
          {(!isEditMode || !(bill.status === 'Approved' || bill.status === 'Paid' || bill.status === 'Cancelled')) && (
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-save me-2"></i> {isEditMode ? 'Save Changes' : 'Record Bill'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default BillFormPage;
