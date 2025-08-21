// /04-Application/frontend/src/pages/RecordJournalEntryPageNew.jsx

import React, { useState, useEffect } from 'react';
import { transactionApi, chartOfAccountApi, userApi, branchApi } from '../services/api';

function RecordJournalEntryPage({ setCurrentPage, transactionToEdit }) {
  // Initial state for a new journal entry
  const initialJournalEntryState = {
    transaction_no: `TXN-${Date.now()}`,
    transaction_type: 'Journal Entry',
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference_no: '',
    is_posted: true,
    addedby: '',
    branch_id: '',
    lines: [
      { account_id: '', amount: '', debit: '', credit: '', description: '' },
      { account_id: '', amount: '', debit: '', credit: '', description: '' }
    ]
  };

  const [journalEntry, setJournalEntry] = useState(initialJournalEntryState);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!transactionToEdit;

  // Fetch lookup data
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        setLookupError(null);
        const [accountsRes, usersRes, branchesRes] = await Promise.all([
          chartOfAccountApi.getAllChartOfAccounts(),
          userApi.getAllUsers(),
          branchApi.getAllBranches(),
        ]);
        setAccounts(accountsRes.data);
        setUsers(usersRes.data);
        setBranches(branchesRes.data);

        if (!isEditMode) {
          setJournalEntry(prev => ({
            ...prev,
            addedby: usersRes.data.length > 0 ? usersRes.data[0].user_id : '',
            branch_id: branchesRes.data.length > 0 ? branchesRes.data[0].branch_id : '',
          }));
        }
      } catch (err) {
        console.error('Failed to fetch lookup data:', err);
        setLookupError('Failed to load necessary data. Please check your backend.');
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, [isEditMode]);

  // Populate form for editing
  useEffect(() => {
    if (isEditMode && transactionToEdit) {
      setJournalEntry({
        transaction_no: transactionToEdit.transaction_no || '',
        transaction_type: transactionToEdit.transaction_type || 'Journal Entry',
        date: transactionToEdit.date || new Date().toISOString().split('T')[0],
        description: transactionToEdit.description || '',
        reference_no: transactionToEdit.reference_no || '',
        is_posted: transactionToEdit.is_posted ?? true,
        addedby: transactionToEdit.addedby || '',
        branch_id: transactionToEdit.branch_id || '',
        lines: [
          {
            account_id: transactionToEdit.account_id || '',
            amount: transactionToEdit.amount?.toString() || '',
            debit: transactionToEdit.debit?.toString() || '',
            credit: transactionToEdit.credit?.toString() || '',
            description: transactionToEdit.description || ''
          }
        ]
      });
    }
  }, [isEditMode, transactionToEdit]);

  const handleJournalEntryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJournalEntry(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...journalEntry.lines];
    newLines[index][field] = value;

    // Clear opposite field when entering debit/credit
    if (field === 'debit' && value) {
      newLines[index].credit = '';
    } else if (field === 'credit' && value) {
      newLines[index].debit = '';
    }

    setJournalEntry(prev => ({
      ...prev,
      lines: newLines
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleAddLine = () => {
    setJournalEntry(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        { account_id: '', amount: '', debit: '', credit: '', description: '' }
      ]
    }));
  };

  const handleRemoveLine = (index) => {
    if (journalEntry.lines.length <= 2) {
      alert('A journal entry must have at least two lines.');
      return;
    }
    setJournalEntry(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  const getTotalDebits = () => {
    return journalEntry.lines.reduce((total, line) => {
      return total + (parseFloat(line.debit) || 0);
    }, 0);
  };

  const getTotalCredits = () => {
    return journalEntry.lines.reduce((total, line) => {
      return total + (parseFloat(line.credit) || 0);
    }, 0);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!journalEntry.date) newErrors.date = 'Date is required';
    if (!journalEntry.description.trim()) newErrors.description = 'Description is required';
    if (!journalEntry.addedby) newErrors.addedby = 'User is required';
    if (!journalEntry.branch_id) newErrors.branch_id = 'Branch is required';

    // Validate lines
    journalEntry.lines.forEach((line, index) => {
      if (!line.account_id) {
        newErrors[`line_${index}_account_id`] = 'Account is required';
      }
      if (!line.description.trim()) {
        newErrors[`line_${index}_description`] = 'Line description is required';
      }
      const debit = parseFloat(line.debit) || 0;
      const credit = parseFloat(line.credit) || 0;
      if (debit === 0 && credit === 0) {
        newErrors[`line_${index}_amount`] = 'Either debit or credit amount is required';
      }
      if (debit > 0 && credit > 0) {
        newErrors[`line_${index}_amount`] = 'Cannot have both debit and credit amounts';
      }
    });

    // Check if debits equal credits
    if (getTotalDebits() !== getTotalCredits()) {
      newErrors.balance = 'Total debits must equal total credits';
    }

    if (getTotalDebits() === 0) {
      newErrors.balance = 'Journal entry cannot have zero amounts';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode) {
        const updatedLineData = {
          transaction_id: transactionToEdit.transaction_id,
          account_id: journalEntry.lines[0].account_id,
          amount: parseFloat(journalEntry.lines[0].amount),
          debit: parseFloat(journalEntry.lines[0].debit),
          credit: parseFloat(journalEntry.lines[0].credit),
          description: journalEntry.lines[0].description,
          transaction_no: journalEntry.transaction_no,
          transaction_type: journalEntry.transaction_type,
          date: journalEntry.date,
          reference_no: journalEntry.reference_no,
          is_posted: journalEntry.is_posted,
          addedby: journalEntry.addedby,
          branch_id: journalEntry.branch_id,
        };
        await transactionApi.updateTransaction(transactionToEdit.transaction_id, updatedLineData);
      } else {
        // Generate transaction number if not provided
        const transactionNo = journalEntry.transaction_no || `TXN-${Date.now()}`;
        
        const dataToSubmit = journalEntry.lines.map(line => {
          const debitAmount = parseFloat(line.debit) || 0;
          const creditAmount = parseFloat(line.credit) || 0;
          const amount = debitAmount || creditAmount; // Use whichever is non-zero as the amount
          
          return {
            account_id: line.account_id,
            amount: amount,
            debit: debitAmount,
            credit: creditAmount,
            transaction_no: transactionNo,
            transaction_type: journalEntry.transaction_type || 'Journal Entry',
            date: journalEntry.date,
            description: line.description || journalEntry.description || 'Journal Entry',
            reference_no: journalEntry.reference_no || '',
            is_posted: journalEntry.is_posted !== undefined ? journalEntry.is_posted : true,
            addedby: journalEntry.addedby || 1, // Default to admin user
            branch_id: journalEntry.branch_id || 1, // Default to first branch
          };
        });
        
        console.log('Data to submit:', dataToSubmit); // Debug log
        await transactionApi.createTransaction(dataToSubmit);
        setJournalEntry(initialJournalEntryState);
      }
      
      setSubmitSuccess(true);
      setTimeout(() => setCurrentPage('transactions'), 1500);
    } catch (err) {
      console.error('Error in transaction submission:', err);
      setSubmitError('Failed to record Journal Entry: ' + (err.response?.data?.error || err.message));
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
            <i className="bi bi-journal-plus me-2"></i>
            {isEditMode ? 'Edit Journal Entry' : 'Record New Journal Entry'}
          </h3>
          <p className="text-muted mb-0">
            {isEditMode ? 'Update existing journal entry' : 'Enter journal entry lines first, then transaction details below'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => setCurrentPage('transactions', null)}
        >
          <i className="bi bi-arrow-left me-2"></i>Back to Transactions
        </button>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          Journal Entry {isEditMode ? 'updated' : 'recorded'} successfully! Redirecting...
          <button type="button" className="btn-close" onClick={() => setSubmitSuccess(false)}></button>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {submitError}
          <button type="button" className="btn-close" onClick={() => setSubmitError(null)}></button>
        </div>
      )}

      {/* Balance Error */}
      {errors.balance && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errors.balance}
          <button type="button" className="btn-close" onClick={() => setErrors(prev => ({ ...prev, balance: null }))}></button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* JOURNAL ENTRY LINES SECTION - COMES FIRST */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>Journal Entry Lines
              </h5>
              <button
                type="button"
                className="btn btn-light btn-sm"
                onClick={handleAddLine}
              >
                <i className="bi bi-plus-circle me-1"></i>Add Line
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '30%' }}>Account</th>
                    <th style={{ width: '30%' }}>Description</th>
                    <th style={{ width: '15%' }}>Debit</th>
                    <th style={{ width: '15%' }}>Credit</th>
                    <th style={{ width: '10%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntry.lines.map((line, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className={`form-select form-select-sm ${errors[`line_${index}_account_id`] ? 'is-invalid' : ''}`}
                          value={line.account_id}
                          onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                        >
                          <option value="">Select Account</option>
                          {accounts.map(account => (
                            <option key={account.account_id} value={account.account_id}>
                              {account.account_code} - {account.name}
                            </option>
                          ))}
                        </select>
                        {errors[`line_${index}_account_id`] && 
                          <div className="invalid-feedback">{errors[`line_${index}_account_id`]}</div>}
                      </td>
                      <td>
                        <textarea
                          className={`form-control form-control-sm ${errors[`line_${index}_description`] ? 'is-invalid' : ''}`}
                          value={line.description}
                          onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                          placeholder="Enter line description..."
                          rows="1"
                          style={{ resize: 'none', height: '34px' }}
                        />
                        {errors[`line_${index}_description`] && 
                          <div className="invalid-feedback">{errors[`line_${index}_description`]}</div>}
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm text-end ${errors[`line_${index}_debit`] ? 'is-invalid' : ''}`}
                          value={line.debit}
                          onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errors[`line_${index}_debit`] && 
                          <div className="invalid-feedback">{errors[`line_${index}_debit`]}</div>}
                      </td>
                      <td>
                        <input
                          type="number"
                          className={`form-control form-control-sm text-end ${errors[`line_${index}_credit`] ? 'is-invalid' : ''}`}
                          value={line.credit}
                          onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errors[`line_${index}_credit`] && 
                          <div className="invalid-feedback">{errors[`line_${index}_credit`]}</div>}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemoveLine(index)}
                          disabled={journalEntry.lines.length <= 2}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-secondary">
                  <tr>
                    <td colSpan="2" className="text-end fw-bold">Totals:</td>
                    <td className="text-end fw-bold">
                      <span className={`${getTotalDebits() !== getTotalCredits() ? 'text-danger' : 'text-success'}`}>
                        ${getTotalDebits().toFixed(2)}
                      </span>
                    </td>
                    <td className="text-end fw-bold">
                      <span className={`${getTotalDebits() !== getTotalCredits() ? 'text-danger' : 'text-success'}`}>
                        ${getTotalCredits().toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center">
                      {getTotalDebits() === getTotalCredits() && getTotalDebits() > 0 ? (
                        <i className="bi bi-check-circle-fill text-success" title="Balanced"></i>
                      ) : (
                        <i className="bi bi-exclamation-triangle-fill text-warning" title="Not Balanced"></i>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* TRANSACTION DETAILS SECTION - COMES BELOW LINES */}
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">
              <i className="bi bi-file-text me-2"></i>Transaction Details
            </h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Transaction Number</label>
                <input
                  type="text"
                  className={`form-control ${errors.transaction_no ? 'is-invalid' : ''}`}
                  name="transaction_no"
                  value={journalEntry.transaction_no}
                  onChange={handleJournalEntryChange}
                  placeholder="Leave blank for auto-generation"
                />
                {errors.transaction_no && <div className="invalid-feedback">{errors.transaction_no}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Date <span className="text-danger">*</span></label>
                <input
                  type="date"
                  className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                  name="date"
                  value={journalEntry.date}
                  onChange={handleJournalEntryChange}
                  required
                />
                {errors.date && <div className="invalid-feedback">{errors.date}</div>}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label fw-semibold">Overall Description <span className="text-danger">*</span></label>
                <textarea
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  name="description"
                  rows="2"
                  value={journalEntry.description}
                  onChange={handleJournalEntryChange}
                  placeholder="Enter a brief description of the journal entry..."
                  required
                />
                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Reference Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="reference_no"
                  value={journalEntry.reference_no}
                  onChange={handleJournalEntryChange}
                  placeholder="e.g., INV-001, PAYMT-123"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Added By <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.addedby ? 'is-invalid' : ''}`}
                  name="addedby"
                  value={journalEntry.addedby}
                  onChange={handleJournalEntryChange}
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
                {errors.addedby && <div className="invalid-feedback">{errors.addedby}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Branch <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.branch_id ? 'is-invalid' : ''}`}
                  name="branch_id"
                  value={journalEntry.branch_id}
                  onChange={handleJournalEntryChange}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branch_id && <div className="invalid-feedback">{errors.branch_id}</div>}
              </div>
            </div>

            <div className="row">
              <div className="col-md-12">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_posted"
                    checked={journalEntry.is_posted}
                    onChange={handleJournalEntryChange}
                  />
                  <label className="form-check-label">
                    Post this journal entry immediately
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <button
              type="submit"
              className="btn btn-primary btn-lg px-5"
              disabled={isSubmitting || getTotalDebits() !== getTotalCredits() || getTotalDebits() === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {isEditMode ? 'Updating...' : 'Recording...'}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {isEditMode ? 'Update Journal Entry' : 'Record Journal Entry'}
                </>
              )}
            </button>
            {getTotalDebits() !== getTotalCredits() && (
              <div className="text-danger mt-2 small">
                <i className="bi bi-exclamation-triangle me-1"></i>
                Debits must equal credits before submitting
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export default RecordJournalEntryPage;
