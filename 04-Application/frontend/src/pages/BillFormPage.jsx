// /04-Application/backend/frontend/src/pages/BillFormPage.jsx

import React, { useState, useEffect } from 'react';
import { billApi, partyApi, chartOfAccountApi } from '../services/api';

function BillFormPage({ setCurrentPage, billToEdit }) {
  const isEditMode = !!billToEdit;

  // Initial state for the bill form
  const initialBillState = {
    party_id: '',
    document_no: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    total_amount: '0.00',
    status: 'Draft',
    lineItems: [
      { description: '', quantity: '1', unit_price: '0.00', line_total_amount: '0.00', account_id: '' },
    ],
  };

  const [bill, setBill] = useState(initialBillState);
  const [supplierParties, setSupplierParties] = useState([]);
  const [expenseAssetAccounts, setExpenseAssetAccounts] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        const filteredAccounts = accountsRes.data.filter(
          account => account.accountType && (
            account.accountType.category === 'Expense' ||
            account.accountType.category === 'Asset'
          )
        );
        setExpenseAssetAccounts(filteredAccounts);
      } catch (err) {
        console.error('Error fetching lookups:', err);
        setLookupError('Failed to load required data. Please refresh and try again.');
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, []);

  // Pre-populate form if editing
  useEffect(() => {
    if (isEditMode && billToEdit) {
      setBill({
        ...billToEdit,
        issue_date: billToEdit.issue_date ? new Date(billToEdit.issue_date).toISOString().split('T')[0] : '',
        due_date: billToEdit.due_date ? new Date(billToEdit.due_date).toISOString().split('T')[0] : '',
        lineItems: billToEdit.billLineItems && billToEdit.billLineItems.length > 0 
          ? billToEdit.billLineItems.map(item => ({
              bill_line_id: item.bill_line_id,
              description: item.description || '',
              quantity: item.quantity?.toString() || '1',
              unit_price: item.unit_price?.toString() || '0.00',
              line_total_amount: item.line_total_amount?.toString() || '0.00',
              account_id: item.account_id || ''
            }))
          : [{ description: '', quantity: '1', unit_price: '0.00', line_total_amount: '0.00', account_id: '' }]
      });
    }
  }, [isEditMode, billToEdit]);

  // Auto-calculate total whenever line items change
  useEffect(() => {
    const calculatedTotal = bill.lineItems.reduce((total, item) => {
      return total + (parseFloat(item.line_total_amount) || 0);
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

    if (!bill.party_id) newErrors.party_id = 'Supplier is required';
    if (!bill.document_no.trim()) newErrors.document_no = 'Document number is required';
    if (!bill.issue_date) newErrors.issue_date = 'Issue date is required';
    if (!bill.due_date) newErrors.due_date = 'Due date is required';

    // Validate line items
    bill.lineItems.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`lineItem_${index}_description`] = 'Description is required';
      }
      if (!item.account_id) {
        newErrors[`lineItem_${index}_account_id`] = 'Account is required';
      }
      if (parseFloat(item.quantity) <= 0) {
        newErrors[`lineItem_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (parseFloat(item.unit_price) <= 0) {
        newErrors[`lineItem_${index}_unit_price`] = 'Unit price must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsSubmitting(false);
      return;
    }

    const billToSave = { ...bill };
    billToSave.lineItems = billToSave.lineItems.map(item => {
        if (item.bill_line_id && isEditMode) {
            return { bill_line_id: item.bill_line_id, ...item };
        }
        const { bill_line_id, ...rest } = item;
        return rest;
    });

    try {
      if (isEditMode) {
        if (billToEdit.status === 'Approved' || billToEdit.status === 'Paid' || billToEdit.status === 'Cancelled') {
          setSubmitError(`Cannot edit a bill with status '${billToEdit.status}'.`);
          setIsSubmitting(false);
          return;
        }
        await billApi.updateBill(billToEdit.bill_id, billToSave);
      } else {
        await billApi.createBill(billToSave);
      }
      setSubmitSuccess(true);
      setTimeout(() => setCurrentPage('bills', null), 1500);
    } catch (err) {
      console.error('Error saving bill:', err);
      setSubmitError('Failed to save bill: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingLookups) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (lookupError) {
    return (
      <div className="alert alert-danger" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {lookupError}
      </div>
    );
  }

  return (
    <div className="container-fluid px-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="text-dark mb-1">
            <i className="bi bi-receipt me-2"></i>
            {isEditMode ? 'Edit Bill' : 'Create New Bill'}
          </h3>
          <p className="text-muted mb-0">
            {isEditMode ? 'Update existing supplier bill' : 'Enter line items first, then bill details below'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setCurrentPage('bills', null)}
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Bills
        </button>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          Bill {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
          <button type="button" className="btn-close" onClick={() => setSubmitSuccess(false)}></button>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {submitError}
          <button type="button" className="btn-close" onClick={() => setSubmitError(false)}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* LINE ITEMS SECTION - COMES FIRST */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>Line Items
              </h5>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={handleAddLineItem}
              >
                <i className="bi bi-plus-circle me-1"></i>Add Item
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '35%' }}>Description</th>
                    <th style={{ width: '15%' }}>Account</th>
                    <th style={{ width: '12%' }}>Quantity</th>
                    <th style={{ width: '15%' }}>Unit Price</th>
                    <th style={{ width: '15%' }}>Total</th>
                    <th style={{ width: '8%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.lineItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <textarea
                          className={`form-control form-control-sm ${errors[`lineItem_${index}_description`] ? 'is-invalid' : ''}`}
                          name="description"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, e)}
                          placeholder="Enter item description..."
                          rows="1"
                          style={{ resize: 'none', height: '34x' }}
                        />
                        {errors[`lineItem_${index}_description`] && 
                          <div className="invalid-feedback">{errors[`lineItem_${index}_description`]}</div>}
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${errors[`lineItem_${index}_account_id`] ? 'is-invalid' : ''}`}
                          name="account_id"
                          value={item.account_id}
                          onChange={(e) => handleLineItemChange(index, e)}
                        >
                          <option value="">Select Account</option>
                          {expenseAssetAccounts.map(account => (
                            <option key={account.account_id} value={account.account_id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                        {errors[`lineItem_${index}_account_id`] && 
                          <div className="invalid-feedback">{errors[`lineItem_${index}_account_id`]}</div>}
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm text-end ${errors[`lineItem_${index}_quantity`] ? 'is-invalid' : ''}`}
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, e)}
                          min="0.01"
                          step="0.01"
                        />
                        {errors[`lineItem_${index}_quantity`] && 
                          <div className="invalid-feedback">{errors[`lineItem_${index}_quantity`]}</div>}
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm text-end ${errors[`lineItem_${index}_unit_price`] ? 'is-invalid' : ''}`}
                          name="unit_price"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(index, e)}
                          min="0.01"
                          step="0.01"
                        />
                        {errors[`lineItem_${index}_unit_price`] && 
                          <div className="invalid-feedback">{errors[`lineItem_${index}_unit_price`]}</div>}
                      </td>
                      <td>
                        <div className="form-control form-control-sm text-end bg-light">
                          ${parseFloat(item.line_total_amount).toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemoveLineItem(index)}
                          disabled={bill.lineItems.length <= 1}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-secondary">
                  <tr>
                    <td colSpan="4" className="text-end fw-bold">Total Amount:</td>
                    <td className="text-end fw-bold fs-5 text-primary">
                      ${parseFloat(bill.total_amount).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* BILL DETAILS SECTION - COMES BELOW LINE ITEMS */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">
              <i className="bi bi-file-text me-2"></i>Bill Details
            </h5>
          </div>
          <div className="card-body py-3">
            <div className="row g-2">
              {/* Supplier */}
              <div className="col-md-6">
                <label htmlFor="party_id" className="form-label">
                  Supplier <span className="text-danger">*</span>
                </label>
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

              {/* Document Number */}
              <div className="col-md-6">
                <label htmlFor="document_no" className="form-label">
                  Document Number <span className="text-danger">*</span>
                </label>
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

              {/* Issue Date */}
              <div className="col-md-6">
                <label htmlFor="issue_date" className="form-label">
                  Issue Date <span className="text-danger">*</span>
                </label>
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

              {/* Due Date */}
              <div className="col-md-6">
                <label htmlFor="due_date" className="form-label">
                  Due Date <span className="text-danger">*</span>
                </label>
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

              {/* Status - Display Only */}
              <div className="col-md-6">
                <label className="form-label">Status</label>
                <div className="form-control bg-light">
                  <span className={`badge ${
                    bill.status === 'Draft' ? 'bg-secondary' :
                    bill.status === 'Pending Approval' ? 'bg-warning' :
                    bill.status === 'Approved' ? 'bg-info' :
                    bill.status === 'Paid' ? 'bg-success' :
                    bill.status === 'Partially Paid' ? 'bg-warning' :
                    'bg-danger'
                  }`}>
                    {bill.status}
                  </span>
                </div>
              </div>

              {/* Total Amount - Display Only */}
              <div className="col-md-6">
                <label className="form-label">Total Amount (Calculated)</label>
                <div className="form-control bg-light text-end fw-bold fs-5 text-primary">
                  ${parseFloat(bill.total_amount).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setCurrentPage('bills', null)}
              >
                <i className="bi bi-x-circle me-2"></i>Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </span>
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    {isEditMode ? 'Update Bill' : 'Create Bill'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default BillFormPage;
