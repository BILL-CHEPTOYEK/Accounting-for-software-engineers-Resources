// /04-Application/backend/frontend/src/pages/PartiesPaymentPage.jsx

import React, { useState, useEffect } from 'react';
// Correct import paths for API services
import { invoiceApi, billApi, userApi, branchApi, chartOfAccountApi } from '../services/api';
// Using react-toastify for notifications, as suggested by your provided code's logic
import { toast } from 'react-toastify';
// Ensure react-toastify CSS is imported globally in your project, e.g., in src/main.jsx or src/index.js

function PartiesPaymentPage({ setCurrentPage }) {
  const [paymentType, setPaymentType] = useState('customerPayment'); // 'customerPayment' or 'supplierPayment'
  const [payment, setPayment] = useState({
    document_id: '', // Will hold invoice_id or bill_id
    payment_date: new Date().toISOString().split('T')[0],
    amount: '0.00', // Unified amount field
    payment_method: 'Cash', // Default to Cash (for receipt) or Bank (for payment)
    addedby: '',
    branch_id: '',
    description: '',
  });

  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cashBankAccounts, setCashBankAccounts] = useState([]); // For customer receipts (debit) and supplier payments (credit)
  const [liabilityAccounts, setLiabilityAccounts] = useState([]); // Fetched but not directly used in this form's UI
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedDocumentRemainingBalance, setSelectedDocumentRemainingBalance] = useState(0);

  // Initial state for resetting the form
  const initialPaymentState = {
    document_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    amount: '0.00',
    payment_method: 'Cash', // Reset to default cash
    addedby: '',
    branch_id: '',
    description: '',
  };

  // Fetch lookup data on component mount
  useEffect(() => {
    fetchLookups();
  }, [paymentType]);

  // Function to fetch/refresh lookup data
  const fetchLookups = async () => {
    try {
      setLoadingLookups(true);
      setLookupError(null);

      const [invoicesRes, billsRes, usersRes, branchesRes, accountsRes] = await Promise.all([
        invoiceApi.getAllInvoices(),
        billApi.getAllBills(),
        userApi.getAllUsers(),
        branchApi.getAllBranches(),
        chartOfAccountApi.getAllChartOfAccounts(),
      ]);

      // Filter invoices that have outstanding balance (not fully paid)
      // CRITICAL: Only show unpaid invoices (exclude cash sales and fully paid invoices)
      setInvoices(invoicesRes.data.filter(inv => {
        const outstandingBalance = parseFloat(inv.outstanding_balance || 0);
        // Only show invoices that need payment - exclude completed/cancelled invoices
        const excludedStatuses = ['Cancelled', 'Draft', 'Paid', 'Void'];
        return outstandingBalance > 0.01 && !excludedStatuses.includes(inv.status);
      }));

      // Filter bills that have outstanding balance (not fully paid)
      setBills(billsRes.data.filter(bill => {
        const outstandingBalance = parseFloat(bill.outstanding_balance || 0);
        // Only show bills with positive outstanding balance and not cancelled
        return outstandingBalance > 0.01 && bill.status !== 'Cancelled' && bill.status !== 'Draft';
      }));

      setUsers(usersRes.data);
      setBranches(branchesRes.data);

      // Filter for Cash/Bank accounts (Current Asset type)
      const filteredCashBankAccounts = accountsRes.data.filter(
        account => account.accountType && account.accountType.name === 'Current Asset' &&
                   (account.name === 'Cash' || account.name === 'Bank')
      );
      setCashBankAccounts(filteredCashBankAccounts);

      // Filter for Liability accounts (e.g., Accounts Payable)
      // This is fetched but not directly used in the UI dropdown for payment method
      const filteredLiabilityAccounts = accountsRes.data.filter(
        account => account.accountType && account.accountType.name === 'Current Liability' &&
                   (account.name === 'Accounts Payable')
      );
      setLiabilityAccounts(filteredLiabilityAccounts);

      // Set initial defaults for user and branch
      setPayment(prev => ({
        ...prev,
        addedby: usersRes.data.length > 0 ? usersRes.data[0].user_id : '',
        branch_id: branchesRes.data.length > 0 ? branchesRes.data[0].branch_id : '',
        // Default payment method based on type, ensuring it's a valid cash/bank account name
        payment_method: filteredCashBankAccounts.length > 0 ? filteredCashBankAccounts[0].name : 'Cash',
      }));

    } catch (err) {
      console.error('Failed to fetch lookup data:', err);
      setLookupError('Failed to load necessary data. Please check your backend.');
      toast.error('Failed to load necessary data. Please check your backend.');
    } finally {
      setLoadingLookups(false);
    }
  };

  // Update remaining balance when selected document or payment type changes
  useEffect(() => {
    let balance = 0;
    if (payment.document_id) {
      if (paymentType === 'customerPayment') {
        const selectedInvoice = invoices.find(inv => inv.invoice_id === payment.document_id);
        if (selectedInvoice) {
          balance = parseFloat(selectedInvoice.outstanding_balance || selectedInvoice.total_amount || 0).toFixed(2);
        }
      } else { // supplierPayment
        const selectedBill = bills.find(bill => bill.bill_id === payment.document_id);
        if (selectedBill) {
          balance = parseFloat(selectedBill.outstanding_balance || selectedBill.total_amount || 0).toFixed(2);
        }
      }
    }
    setSelectedDocumentRemainingBalance(balance);
  }, [payment.document_id, paymentType, invoices, bills]);

  const handlePaymentTypeChange = (e) => {
    const newPaymentType = e.target.value;
    setPaymentType(newPaymentType);
    setPayment(prev => ({
      ...prev,
      document_id: '', // Reset document selection
      amount: '0.00',
      // Reset payment method to a default from available cash/bank accounts
      payment_method: cashBankAccounts.length > 0 ? cashBankAccounts[0].name : 'Cash',
    }));
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPayment(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    if (!payment.document_id) newErrors.document_id = `${paymentType === 'customerPayment' ? 'Invoice' : 'Bill'} is required.`;
    if (!payment.payment_date) {
      newErrors.payment_date = 'Payment Date is required.';
    } else if (payment.payment_date > today) {
      newErrors.payment_date = 'Payment Date cannot be in the future.';
    }
    if (isNaN(parseFloat(payment.amount)) || parseFloat(payment.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number.';
    } else if (parseFloat(payment.amount) > parseFloat(selectedDocumentRemainingBalance) + 0.001) { // Add small tolerance for floats
      newErrors.amount = `Amount cannot exceed remaining balance of $${selectedDocumentRemainingBalance}.`;
    }
    // Check if the selected payment_method name maps to a valid account ID
    const selectedAccount = cashBankAccounts.find(acc => acc.name === payment.payment_method);
    if (!selectedAccount) newErrors.payment_method = 'A valid Cash/Bank account is required.';

    if (!payment.addedby) newErrors.addedby = 'User who recorded transaction is required.';
    if (!payment.branch_id) newErrors.branch_id = 'Branch is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!validateForm()) {
      toast.error('Please correct the errors in the form.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const selectedCashBankAccount = cashBankAccounts.find(acc => acc.name === payment.payment_method);
      if (!selectedCashBankAccount) {
        setSubmitError(`Selected Cash/Bank account '${payment.payment_method}' not found.`);
        toast.error(`Selected Cash/Bank account '${payment.payment_method}' not found.`);
        return;
      }

      const commonPaymentData = {
        payment_date: payment.payment_date,
        amount: parseFloat(payment.amount), // Unified amount
        payment_method: payment.payment_method,
        // Using the account_id from the found cash/bank account
        account_id: selectedCashBankAccount.account_id,
        addedby: payment.addedby,
        branch_id: payment.branch_id,
        description: payment.description,
      };

      if (paymentType === 'customerPayment') {
        const selectedInvoice = invoices.find(inv => inv.invoice_id === payment.document_id);
        if (!selectedInvoice) {
          setSubmitError('Selected invoice not found.');
          toast.error('Selected invoice not found.');
          return;
        }

        const customerPaymentData = {
          invoice_id: payment.document_id,
          // Explicitly adding party_id and document_no for the backend
          party_id: selectedInvoice.party_id,
          document_no: `PMT-INV-${selectedInvoice.document_no}-${Date.now()}`, // Unique payment document number
          ...commonPaymentData,
          description: payment.description || `Payment received for Invoice ${selectedInvoice.document_no} from ${selectedInvoice.party_name}`,
        };
        await invoiceApi.recordPayment(customerPaymentData);
        setSubmitSuccess(true);
        toast.success('Customer payment recorded successfully!');
        setPayment(initialPaymentState); // Reset form
        
        // Refresh invoice/bill data to update the lists immediately
        await fetchLookups();
      } else { // supplierPayment
        const selectedBill = bills.find(bill => bill.bill_id === payment.document_id);
        if (!selectedBill) {
          setSubmitError('Selected bill not found.');
          toast.error('Selected bill not found.');
          return;
        }

        const supplierPaymentData = {
          bill_id: payment.document_id,
          // Explicitly adding party_id and document_no for the backend
          party_id: selectedBill.party_id,
          document_no: `PMT-BIL-${selectedBill.document_no}-${Date.now()}`, // Unique payment document number
          ...commonPaymentData,
          description: payment.description || `Payment made for Bill ${selectedBill.document_no} to ${selectedBill.party_name}`,
        };
        await billApi.recordPayment(supplierPaymentData);
        setSubmitSuccess(true);
        toast.success('Supplier payment recorded successfully!');
        setPayment(initialPaymentState); // Reset form
        
        // Refresh invoice/bill data to update the lists immediately
        await fetchLookups();
      }
      setErrors({});
      // Assuming setCurrentPage navigates back to a list of transactions or dashboard
      setTimeout(() => setCurrentPage('transactions'), 1500);
    } catch (err) {
      console.error('Error recording payment:', err);
      const errorMessage = 'Failed to record payment: ' + (err.response?.data?.error || err.message || 'Unknown error');
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (loadingLookups) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-info" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-info">Loading necessary data...</p>
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
        <span><i className="bi bi-cash-coin me-2 text-primary"></i> Parties Payment</span>
        <button className="btn btn-secondary shadow-sm" onClick={() => setCurrentPage('transactions')}>
          <i className="bi bi-arrow-left-circle me-2"></i> Back to Transactions
        </button>
      </h2>

      {/* Toast messages are handled by ToastContainer */}

      <form onSubmit={handleSubmit}>
        <div className="card shadow-sm p-4 mb-4">
          <h5 className="card-title p-4 b-3 bg-primary text-white rounded-top">Payment Details</h5>
          <div className="row g-3 px-3 py-3"> {/* Added padding for inside card body */}
            {/* Payment Type Selection */}
            <div className="col-md-6">
              <label htmlFor="paymentType" className="form-label mb-1">Payment Type <span className="text-danger">*</span></label>
              <select
                className="form-select form-select-sm"
                id="paymentType"
                name="paymentType"
                value={paymentType}
                onChange={handlePaymentTypeChange}
              >
                <option value="customerPayment">Customer Payment (Receive)</option>
                <option value="supplierPayment">Supplier Payment (Pay)</option>
              </select>
            </div>

            {/* Document Selection (Invoice or Bill) */}
            <div className="col-md-6">
              <label htmlFor="document_id" className="form-label mb-1">
                Select {paymentType === 'customerPayment' ? 'Invoice' : 'Bill'} <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select form-select-sm ${errors.document_id ? 'is-invalid' : ''}`}
                id="document_id"
                name="document_id"
                value={payment.document_id}
                onChange={handlePaymentChange}
              >
                <option value="">Select a Document</option>
                {paymentType === 'customerPayment' ? (
                  invoices.length === 0 ? (
                    <option value="" disabled>No outstanding invoices</option>
                  ) : (
                    invoices.map(inv => (
                      <option key={inv.invoice_id} value={inv.invoice_id}>
                        {inv.document_no} - {new Date(inv.issue_date).toLocaleDateString()} (Due: ${parseFloat(inv.total_amount_due || inv.total_amount).toFixed(2)})
                      </option>
                    ))
                  )
                ) : (
                  bills.length === 0 ? (
                    <option value="" disabled>No outstanding bills</option>
                  ) : (
                    bills.map(bill => (
                      <option key={bill.bill_id} value={bill.bill_id}>
                        {bill.document_no} - {new Date(bill.issue_date).toLocaleDateString()} (Due: ${parseFloat(bill.total_amount_due || bill.total_amount).toFixed(2)})
                      </option>
                    ))
                  )
                )}
              </select>
              {errors.document_id && <div className="invalid-feedback">{errors.document_id}</div>}
              {payment.document_id && selectedDocumentRemainingBalance > 0 && (
                 <small className="form-text text-muted mt-1">Remaining Balance: <span className="fw-bold text-info">${selectedDocumentRemainingBalance}</span></small>
              )}
               {payment.document_id && selectedDocumentRemainingBalance == 0 && (
                 <small className="form-text text-muted mt-1 text-success">This document is fully paid. 🎉</small>
              )}
            </div>

            {/* Payment Date */}
            <div className="col-md-6">
              <label htmlFor="payment_date" className="form-label mb-1">Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className={`form-control form-control-sm ${errors.payment_date ? 'is-invalid' : ''}`}
                id="payment_date"
                name="payment_date"
                value={payment.payment_date}
                onChange={handlePaymentChange}
              />
              {errors.payment_date && <div className="invalid-feedback">{errors.payment_date}</div>}
            </div>

            {/* Amount */}
            <div className="col-md-6">
              <label htmlFor="amount" className="form-label mb-1">Amount {paymentType === 'customerPayment' ? 'Received' : 'Paid'} <span className="text-danger">*</span></label>
              <input
                type="number"
                step="0.01"
                className={`form-control form-control-sm text-end ${errors.amount ? 'is-invalid' : ''}`}
                id="amount"
                name="amount"
                value={payment.amount}
                onChange={handlePaymentChange}
                min="0.01"
              />
              {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
            </div>

            {/* Payment Method / Source of Funds (Cash/Bank Account) */}
            <div className="col-md-6">
              <label htmlFor="payment_method" className="form-label mb-1">
                {paymentType === 'customerPayment' ? 'Deposit To (Cash/Bank)' : 'Pay From (Cash/Bank)'} <span className="text-danger">*</span>
              </label>
              <select
                className={`form-select form-select-sm ${errors.payment_method ? 'is-invalid' : ''}`}
                id="payment_method"
                name="payment_method"
                value={payment.payment_method}
                onChange={handlePaymentChange}
              >
                {/* Options for Cash/Bank accounts (current assets) */}
                {cashBankAccounts.length === 0 ? (
                  <option value="" disabled>No Cash/Bank accounts available</option>
                ) : (
                  cashBankAccounts.map(account => (
                    <option key={account.account_id} value={account.name}>
                      {account.name} ({account.account_no})
                    </option>
                  ))
                )}
              </select>
              {errors.payment_method && <div className="invalid-feedback">{errors.payment_method}</div>}
            </div>

            {/* Description */}
            <div className="col-12">
              <label htmlFor="description" className="form-label mb-1">Description</label>
              <textarea
                className="form-control form-control-sm"
                id="description"
                name="description"
                value={payment.description}
                onChange={handlePaymentChange}
                rows="2"
                placeholder={`Optional description for the ${paymentType === 'customerPayment' ? 'receipt' : 'payment'}`}
              ></textarea>
            </div>

            {/* Hidden fields for backend use */}
            {/* These should ideally be set dynamically from logged-in user context */}
            <input type="hidden" name="addedby" value={payment.addedby} />
            <input type="hidden" name="branch_id" value={payment.branch_id} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('transactions')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <i className="bi bi-check-circle me-2"></i> Record {paymentType === 'customerPayment' ? 'Receipt' : 'Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PartiesPaymentPage;
