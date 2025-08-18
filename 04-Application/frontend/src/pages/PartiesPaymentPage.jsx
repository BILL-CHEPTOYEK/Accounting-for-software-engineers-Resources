// /04-Application/backend/frontend/src/pages/PartiesPaymentPage.jsx

import React, { useState, useEffect } from 'react';
import { invoiceApi, billApi, userApi, branchApi, chartOfAccountApi } from '../services/api';

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
  const [cashBankAccounts, setCashBankAccounts] = useState([]); // For customer receipts (debit)
  const [liabilityAccounts, setLiabilityAccounts] = useState([]); // For supplier payments (credit) - Note: Not directly used for UI, but good to fetch
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
    payment_method: 'Cash',
    addedby: '',
    branch_id: '',
    description: '',
  };

  // Fetch lookup data on component mount
  useEffect(() => {
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

        // Filter invoices that are not fully paid or are in 'Posted_Credit_Sale' status
        setInvoices(invoicesRes.data.filter(inv =>
          (inv.status === 'Posted_Credit_Sale' || (inv.total_amount_due && parseFloat(inv.total_amount_due) > 0))
        ));

        // Filter bills that are not fully paid or are in 'Posted_Credit_Purchase' status
        setBills(billsRes.data.filter(bill =>
          (bill.status === 'Posted_Credit_Purchase' || (bill.total_amount_due && parseFloat(bill.total_amount_due) > 0))
        ));

        setUsers(usersRes.data);
        setBranches(branchesRes.data);

        // Filter for Cash/Bank accounts (Current Asset)
        const filteredCashBankAccounts = accountsRes.data.filter(
          account => account.accountType && account.accountType.name === 'Current Asset' &&
                     (account.name === 'Cash' || account.name === 'Bank')
        );
        setCashBankAccounts(filteredCashBankAccounts);

        // Filter for Liability accounts (e.g., Accounts Payable)
        // This is fetched but not directly used in the UI dropdown for payment method
        // in this form, as the payment method is always a cash/bank account.
        const filteredLiabilityAccounts = accountsRes.data.filter(
          account => account.accountType && account.accountType.name === 'Current Liability' &&
                     (account.name === 'Accounts Payable') 
        );
        setLiabilityAccounts(filteredLiabilityAccounts);

        // Set initial defaults
        setPayment(prev => ({
          ...prev,
          addedby: usersRes.data.length > 0 ? usersRes.data[0].user_id : '',
          branch_id: branchesRes.data.length > 0 ? branchesRes.data[0].branch_id : '',
          payment_method: paymentType === 'customerPayment' ? 'Cash' : 'Bank', 
        }));

      } catch (err) {
        console.error('Failed to fetch lookup data:', err);
        setLookupError('Failed to load necessary data. Please check your backend.');
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, [paymentType]); 

  // Update remaining balance when selected document or payment type changes
  useEffect(() => {
    let balance = 0;
    if (payment.document_id) {
      if (paymentType === 'customerPayment') {
        const selectedInvoice = invoices.find(inv => inv.invoice_id === payment.document_id);
        if (selectedInvoice) {
          balance = parseFloat(selectedInvoice.total_amount_due || selectedInvoice.total_amount).toFixed(2);
        }
      } else { // supplierPayment
        const selectedBill = bills.find(bill => bill.bill_id === payment.document_id);
        if (selectedBill) {
          balance = parseFloat(selectedBill.total_amount_due || selectedBill.total_amount).toFixed(2);
        }
      }
    }
    setSelectedDocumentRemainingBalance(balance);
  }, [payment.document_id, paymentType, invoices, bills]);

  const handlePaymentTypeChange = (e) => {
    setPaymentType(e.target.value);
    setPayment(prev => ({
      ...prev,
      document_id: '',
      amount: '0.00',
      payment_method: e.target.value === 'customerPayment' ? 'Cash' : 'Bank',
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
    } else if (parseFloat(payment.amount) > parseFloat(selectedDocumentRemainingBalance)) {
      newErrors.amount = `Amount cannot exceed remaining balance of $${selectedDocumentRemainingBalance}.`;
    }
    if (!payment.payment_method) newErrors.payment_method = 'Payment Method is required.';
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const commonPaymentData = {
        payment_date: payment.payment_date,
        amount: parseFloat(payment.amount), // Unified amount
        payment_method: payment.payment_method, 
        addedby: payment.addedby,
        branch_id: payment.branch_id,
        description: payment.description,
      };

      if (paymentType === 'customerPayment') {
        const selectedInvoice = invoices.find(inv => inv.invoice_id === payment.document_id);
        if (!selectedInvoice) {
          setSubmitError('Selected invoice not found.');
          return;
        }
        const cashBankAccount = cashBankAccounts.find(acc => acc.name === payment.payment_method);
        if (!cashBankAccount) {
          setSubmitError(`Cash/Bank account for '${payment.payment_method}' not found.`);
          return;
        }

        const customerPaymentData = {
          invoice_id: payment.document_id,
          ...commonPaymentData,
          cash_bank_account_id: cashBankAccount.account_id, // This is the account being debited
          description: payment.description || `Payment received for Invoice ${selectedInvoice.document_no}`,
        };
        await invoiceApi.recordPayment(customerPaymentData); // Call invoiceApi.recordPayment
        setSubmitSuccess(true);
        setPayment(initialPaymentState); // Reset form
      } else { // supplierPayment
        const selectedBill = bills.find(bill => bill.bill_id === payment.document_id);
        if (!selectedBill) {
          setSubmitError('Selected bill not found.');
          return;
        }
        const cashBankAccount = cashBankAccounts.find(acc => acc.name === payment.payment_method); // This is the account being credited
        if (!cashBankAccount) {
          setSubmitError(`Cash/Bank account for '${payment.payment_method}' not found.`);
          return;
        }

        const supplierPaymentData = {
          bill_id: payment.document_id,
          ...commonPaymentData,
          cash_bank_account_id: cashBankAccount.account_id, // This is the account being credited
          description: payment.description || `Payment made for Bill ${selectedBill.document_no}`,
        };
        await billApi.recordPayment(supplierPaymentData); // Call billApi.recordPayment
        setSubmitSuccess(true);
        setPayment(initialPaymentState); // Reset form
      }
      setErrors({});
      setTimeout(() => setCurrentPage('transactions'), 1500);
    } catch (err) {
      console.error('Error recording payment:', err);
      setSubmitError('Failed to record payment: ' + (err.response?.data?.error || err.message));
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

      {submitSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> Payment recorded successfully!
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
        <div className="card shadow-sm p-4 mb-4">
          <h5 className="card-title p-4 b-3 bg-primary text-white">Payment Details</h5>
          <div className="row g-3">
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
                  invoices.map(inv => (
                    <option key={inv.invoice_id} value={inv.invoice_id}>
                      {inv.document_no} - {new Date(inv.issue_date).toLocaleDateString()} (Due: ${parseFloat(inv.total_amount_due || inv.total_amount).toFixed(2)})
                    </option>
                  ))
                ) : (
                  bills.map(bill => (
                    <option key={bill.bill_id} value={bill.bill_id}>
                      {bill.document_no} - {new Date(bill.issue_date).toLocaleDateString()} (Due: ${parseFloat(bill.total_amount_due || bill.total_amount).toFixed(2)})
                    </option>
                  ))
                )}
              </select>
              {errors.document_id && <div className="invalid-feedback">{errors.document_id}</div>}
              {payment.document_id && selectedDocumentRemainingBalance > 0 && (
                 <small className="form-text text-muted mt-1">Remaining Balance: <span className="fw-bold text-info">${selectedDocumentRemainingBalance}</span></small>
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

            {/* Payment Method / Source of Funds */}
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
                {cashBankAccounts.map(account => (
                  <option key={account.account_id} value={account.name}>
                    {account.name} ({account.account_no})
                  </option>
                ))}
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
