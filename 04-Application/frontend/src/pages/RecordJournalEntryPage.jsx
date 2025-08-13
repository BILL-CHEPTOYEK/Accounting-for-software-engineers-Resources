// /04-Application/backend/frontend/src/pages/RecordJournalEntryPage.jsx

import React, { useState, useEffect } from 'react';
import { transactionApi, chartOfAccountApi, userApi, branchApi } from '../services/api';

function RecordJournalEntryPage({ setCurrentPage, transactionToEdit }) { // Receive transactionToEdit prop
  // Initial state for a new journal entry
  const initialJournalEntryState = {
    transaction_no: '',
    transaction_type: 'Journal Entry',
    date: new Date().toISOString().split('T')[0], // Default to today's date
    description: '', // Overall JE description
    reference_no: '',
    is_posted: true, // Default to posted for new entries, though user might change for drafts
    addedby: '', // Will be auto-filled by login later
    branch_id: '', // Will be auto-filled by login later
    lines: [
      { account_id: '', amount: '', debit: '', credit: '', description: '' },
      { account_id: '', amount: '', debit: '', credit: '', description: '' } // Start with two lines for double-entry clarity
    ]
  };

  const [journalEntry, setJournalEntry] = useState(initialJournalEntryState);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false); // To show success message
  const [showConfirmation, setShowConfirmation] = useState(false); // For confirmation before submit
  const [errors, setErrors] = useState({}); // <-- THIS LINE MUST BE PRESENT AND CORRECTLY PLACED

  const isEditMode = !!transactionToEdit; // Determine if we are in edit mode

  // Fetch lookup data (accounts, users, branches) on component mount
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

        // Set initial defaults for addedby and branch_id if data available for NEW entry
        if (!isEditMode) {
            setJournalEntry(prev => ({
                ...prev,
                addedby: usersRes.data.length > 0 ? usersRes.data[0].user_id : '',
                branch_id: branchesRes.data.length > 0 ? branchesRes.data[0].branch_id : '',
            }));
        }

      } catch (err) {
        console.error('Failed to fetch lookup data:', err);
        setLookupError('Failed to load necessary data (accounts, users, branches). Please check your backend.');
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, [isEditMode]); // Depend on isEditMode to re-fetch if mode changes (though typically only once)

  // Effect to populate form data when 'transactionToEdit' prop changes (for editing a single line)
  useEffect(() => {
    if (isEditMode && transactionToEdit) {
      // If in edit mode, initialize with the single transaction line provided
      setJournalEntry({
        transaction_no: transactionToEdit.transaction_no || '',
        transaction_type: transactionToEdit.transaction_type || 'Journal Entry',
        date: transactionToEdit.date || new Date().toISOString().split('T')[0],
        description: transactionToEdit.description || '', // Overall JE description
        reference_no: transactionToEdit.reference_no || '',
        is_posted: transactionToEdit.is_posted || true,
        addedby: transactionToEdit.addedby || (users.length > 0 ? users[0].user_id : ''),
        branch_id: transactionToEdit.branch_id || (branches.length > 0 ? branches[0].branch_id : ''),
        lines: [
          {
            transaction_id: transactionToEdit.transaction_id, // Keep ID for update
            account_id: transactionToEdit.account_id || '',
            amount: parseFloat(transactionToEdit.amount) || '',
            debit: parseFloat(transactionToEdit.debit) || '',
            credit: parseFloat(transactionToEdit.credit) || '',
            description: transactionToEdit.description || '', // Line-specific description
          }
        ]
      });
    } else if (!isEditMode) {
      // Reset form for adding new journal entry (only if not already set by initial useEffect)
       setJournalEntry(initialJournalEntryState);
       if (users.length > 0) initialJournalEntryState.addedby = users[0].user_id;
       if (branches.length > 0) initialJournalEntryState.branch_id = branches[0].branch_id;
    }
    setErrors({}); // Clear errors when mode changes
  }, [transactionToEdit, isEditMode, users, branches]); // Re-run when transactionToEdit or mode changes

  // Calculate totals for validation display
  const totalDebits = journalEntry.lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredits = journalEntry.lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Tolerance for float precision

  // --- Handlers for form fields and lines ---
  const handleJournalEntryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJournalEntry(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleLineChange = (index, e) => {
    const { name, value } = e.target;
    const newLines = [...journalEntry.lines];
    const parsedValue = parseFloat(value);

    if (name === 'debit') {
        newLines[index].debit = isNaN(parsedValue) ? '' : parsedValue;
        newLines[index].credit = ''; // Clear credit if debit is entered
        newLines[index].amount = isNaN(parsedValue) ? '' : parsedValue;
    } else if (name === 'credit') {
        newLines[index].credit = isNaN(parsedValue) ? '' : parsedValue;
        newLines[index].debit = ''; // Clear debit if credit is entered
        newLines[index].amount = isNaN(parsedValue) ? '' : parsedValue;
    } else if (name === 'amount') {
        newLines[index].amount = isNaN(parsedValue) ? '' : parsedValue;
        if (newLines[index].debit > 0) {
            newLines[index].debit = isNaN(parsedValue) ? '' : parsedValue;
        } else if (newLines[index].credit > 0) {
            newLines[index].credit = isNaN(parsedValue) ? '' : parsedValue;
        }
    } else {
        newLines[index][name] = value;
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
    if (journalEntry.lines.length <= 1) {
      alert('A journal entry must have at least one line.');
      return;
    }
    setJournalEntry(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index)
    }));
  };

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors = {};
    const today = new Date().toISOString().split('T')[0];

    // Overall Journal Entry Validation (applies to both new and edit modes, but read-only in edit)
    if (!journalEntry.transaction_no.trim()) newErrors.transaction_no = 'Journal Entry Number is required.';
    if (!journalEntry.transaction_type.trim()) newErrors.transaction_type = 'Transaction Type is required.';
    if (!journalEntry.date) {
        newErrors.date = 'Date is required.';
    } else if (journalEntry.date > today) {
        newErrors.date = 'Date cannot be in the future.';
    }
    if (!journalEntry.addedby) newErrors.addedby = 'User (Recorded By) is required.';
    if (!journalEntry.branch_id) newErrors.branch_id = 'Branch is required.';

    // Line-item Validation
    const lineErrors = journalEntry.lines.map((line, index) => {
      const lineSpecificErrors = {};
      if (!line.account_id) lineSpecificErrors.account_id = 'Account is required.';
      if (isNaN(parseFloat(line.amount)) || parseFloat(line.amount) <= 0) {
        lineSpecificErrors.amount = 'Amount must be a positive number.';
      }

      const hasDebit = parseFloat(line.debit) > 0;
      const hasCredit = parseFloat(line.credit) > 0;

      if (!hasDebit && !hasCredit) {
          lineSpecificErrors.debitCredit = 'Must be either Debit OR Credit.';
      } else if (hasDebit && hasCredit) {
          lineSpecificErrors.debitCredit = 'Cannot be both Debit and Credit.';
      }

      if (hasDebit && parseFloat(line.debit) !== parseFloat(line.amount)) {
          lineSpecificErrors.debitAmountMismatch = 'Debit must match Amount.';
      }
      if (hasCredit && parseFloat(line.credit) !== parseFloat(line.amount)) {
          lineSpecificErrors.creditAmountMismatch = 'Credit must match Amount.';
      }

      if (line.account_id && !accounts.some(acc => acc.account_id === line.account_id)) {
        lineSpecificErrors.account_id_invalid = 'Selected account does not exist.';
      }
      return Object.keys(lineSpecificErrors).length > 0 ? lineSpecificErrors : null;
    });

    if (lineErrors.some(err => err !== null)) {
      newErrors.lines = lineErrors;
    }

    // Double-Entry Balance Validation (only for new entries)
    if (!isEditMode && !isBalanced) { // Only enforce strict balance check for new full journal entries
      newErrors.balance = 'Total Debits and Total Credits must be equal.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !newErrors.lines;
  };

  // --- Submission Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (validateForm()) {
      setShowConfirmation(true);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmation(false);

    try {
      if (isEditMode) {
        // If in edit mode, submit only the *single* modified line
        const updatedLineData = {
          transaction_id: transactionToEdit.transaction_id, // Ensure ID is sent for update
          account_id: journalEntry.lines[0].account_id,
          amount: parseFloat(journalEntry.lines[0].amount),
          debit: parseFloat(journalEntry.lines[0].debit),
          credit: parseFloat(journalEntry.lines[0].credit),
          description: journalEntry.lines[0].description,
          // Common JE fields (transaction_no, date, branch_id, addedby, is_posted)
          // are read-only and already part of the original transaction,
          // but we include them here as a safeguard if the backend requires them for validation.
          transaction_no: journalEntry.transaction_no,
          transaction_type: journalEntry.transaction_type,
          date: journalEntry.date,
          reference_no: journalEntry.reference_no,
          is_posted: journalEntry.is_posted,
          addedby: journalEntry.addedby,
          branch_id: journalEntry.branch_id,
        };
        await transactionApi.updateTransaction(transactionToEdit.transaction_id, updatedLineData);
        setSubmitSuccess(true);
        // Optionally navigate back after success in edit mode
        setTimeout(() => setCurrentPage('transactions'), 1500);

      } else {
        // For new journal entry, map lines to include common JE fields
        const dataToSubmit = journalEntry.lines.map(line => ({
          ...line,
          transaction_no: journalEntry.transaction_no,
          transaction_type: journalEntry.transaction_type,
          date: journalEntry.date,
          description: line.description || journalEntry.description,
          reference_no: journalEntry.reference_no,
          is_posted: journalEntry.is_posted,
          addedby: journalEntry.addedby,
          branch_id: journalEntry.branch_id,
        }));
        await transactionApi.createTransaction(dataToSubmit);
        setSubmitSuccess(true);
        setJournalEntry(initialJournalEntryState); // Reset form for new entry
        // Reset initial defaults for addedby and branch_id for the next new entry
        if (users.length > 0) initialJournalEntryState.addedby = users[0].user_id;
        if (branches.length > 0) initialJournalEntryState.branch_id = branches[0].branch_id;
      }

    } catch (err) {
      console.error('Error in transaction submission:', err);
      setSubmitError('Failed to record Journal Entry: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loadingLookups) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary">Loading necessary data...</p>
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
        <span><i className="bi bi-journal-plus me-2 text-success"></i> {isEditMode ? 'Edit Transaction Line' : 'Record New Journal Entry'}</span>
        <button className="btn btn-secondary shadow-sm" onClick={() => setCurrentPage('transactions', null)}>
          <i className="bi bi-arrow-left-circle me-2"></i> Back to Transactions List
        </button>
      </h2>

      {submitSuccess && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {isEditMode ? 'Transaction line updated successfully!' : 'Journal Entry recorded successfully!'}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setSubmitSuccess(false)}></button>
        </div>
      )}

      {submitError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i> {submitError}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" onClick={() => setSubmitError(false)}></button>
        </div>
      )}

      <div className="card shadow-sm p-4 mb-4">
        <h5 className="card-title text-primary mb-3">{isEditMode ? 'Original Journal Entry Details (Read-Only)' : 'Overall Journal Entry Details'}</h5>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="transaction_no" className="form-label">Journal Entry #</label>
            <input
              type="text"
              className={`form-control ${errors.transaction_no ? 'is-invalid' : ''}`}
              id="transaction_no"
              name="transaction_no"
              value={journalEntry.transaction_no}
              onChange={handleJournalEntryChange}
              placeholder="e.g., JE-2025-001"
              readOnly={isEditMode} // Read-only in edit mode
            />
            {errors.transaction_no && <div className="invalid-feedback">{errors.transaction_no}</div>}
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="date" className="form-label">Date</label>
            <input
              type="date"
              className={`form-control ${errors.date ? 'is-invalid' : ''}`}
              id="date"
              name="date"
              value={journalEntry.date}
              onChange={handleJournalEntryChange}
              readOnly={isEditMode} // Read-only in edit mode
            />
            {errors.date && <div className="invalid-feedback">{errors.date}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="branch_id" className="form-label">Branch</label>
            <select
              className={`form-select ${errors.branch_id ? 'is-invalid' : ''}`}
              id="branch_id"
              name="branch_id"
              value={journalEntry.branch_id}
              onChange={handleJournalEntryChange}
              disabled={isEditMode} // Disabled in edit mode
            >
              <option value="">Select Branch</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {errors.branch_id && <div className="invalid-feedback">{errors.branch_id}</div>}
            {!isEditMode && <small className="form-text text-muted">This will be auto-selected based on login once implemented.</small>}
          </div>
          <div className="col-md-6 mb-3">
            <label htmlFor="addedby" className="form-label">Recorded By (User)</label>
            <select
              className={`form-select ${errors.addedby ? 'is-invalid' : ''}`}
              id="addedby"
              name="addedby"
              value={journalEntry.addedby}
              onChange={handleJournalEntryChange}
              disabled={isEditMode} // Disabled in edit mode
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.user_id} value={user.user_id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
            {errors.addedby && <div className="invalid-feedback">{errors.addedby}</div>}
            {!isEditMode && <small className="form-text text-muted">This will be auto-selected based on login once implemented.</small>}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">Overall Journal Entry Description</label>
          <textarea
            className="form-control"
            id="description"
            name="description"
            rows="2"
            value={journalEntry.description}
            onChange={handleJournalEntryChange}
            placeholder="e.g., Record monthly sales, Pay utility bill, Transfer funds"
            readOnly={isEditMode} // Read-only in edit mode
          ></textarea>
        </div>

        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="is_posted"
            name="is_posted"
            checked={journalEntry.is_posted}
            onChange={handleJournalEntryChange}
            disabled={isEditMode} // Disabled in edit mode
          />
          <label className="form-check-label" htmlFor="is_posted">Is Posted (Finalized)</label>
          <small className="form-text text-muted d-block">Once posted, transactions cannot be edited directly, only reversed.</small>
        </div>
      </div>

      {/* Transaction Lines Section */}
      <div className="card shadow-sm p-4 mb-4">
        <h5 className="card-title text-primary mb-3">{isEditMode ? 'Edit Individual Line Details' : 'Journal Entry Lines'}</h5>
        {journalEntry.lines.map((line, index) => (
          <div key={line.transaction_id || index} className="card mb-3 p-3 shadow-sm border">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="mb-0">Line {index + 1}</h6>
              {!isEditMode && journalEntry.lines.length > 1 && (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveLine(index)}>
                  <i className="bi bi-x-circle me-1"></i> Remove Line
                </button>
              )}
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor={`account_id_${index}`} className="form-label">Account</label>
                <select
                  className={`form-select ${errors.lines?.[index]?.account_id || errors.lines?.[index]?.account_id_invalid ? 'is-invalid' : ''}`}
                  id={`account_id_${index}`}
                  name="account_id"
                  value={line.account_id}
                  onChange={(e) => handleLineChange(index, e)}
                  disabled={isEditMode} // Disabled in edit mode (account should not change for a recorded line)
                >
                  <option value="">Select Account</option>
                  {accounts.map(acc => (
                    <option key={acc.account_id} value={acc.account_id}>
                      {acc.account_no} - {acc.name}
                    </option>
                  ))}
                </select>
                {errors.lines?.[index]?.account_id && <div className="invalid-feedback">{errors.lines[index].account_id}</div>}
                {errors.lines?.[index]?.account_id_invalid && <div className="invalid-feedback">{errors.lines[index].account_id_invalid}</div>}
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor={`amount_${index}`} className="form-label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.lines?.[index]?.amount ? 'is-invalid' : ''}`}
                  id={`amount_${index}`}
                  name="amount"
                  value={line.amount}
                  onChange={(e) => handleLineChange(index, e)}
                  placeholder="e.g., 100.00"
                />
                {errors.lines?.[index]?.amount && <div className="invalid-feedback">{errors.lines[index].amount}</div>}
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor={`debit_${index}`} className="form-label">Debit</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.lines?.[index]?.debitCredit || errors.lines?.[index]?.debitAmountMismatch ? 'is-invalid' : ''}`}
                  id={`debit_${index}`}
                  name="debit"
                  value={line.debit}
                  onChange={(e) => handleLineChange(index, e)}
                  disabled={parseFloat(line.credit) > 0} // Disable if credit has a value
                  placeholder="e.g., 100.00"
                />
                {errors.lines?.[index]?.debitCredit && <div className="invalid-feedback">{errors.lines[index].debitCredit}</div>}
                {errors.lines?.[index]?.debitAmountMismatch && <div className="invalid-feedback">{errors.lines[index].debitAmountMismatch}</div>}
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor={`credit_${index}`} className="form-label">Credit</label>
                <input
                  type="number"
                  step="0.01"
                  className={`form-control ${errors.lines?.[index]?.debitCredit || errors.lines?.[index]?.creditAmountMismatch ? 'is-invalid' : ''}`}
                  id={`credit_${index}`}
                  name="credit"
                  value={line.credit}
                  onChange={(e) => handleLineChange(index, e)}
                  disabled={parseFloat(line.debit) > 0} // Disable if debit has a value
                  placeholder="e.g., 100.00"
                />
                {errors.lines?.[index]?.debitCredit && <div className="invalid-feedback">{errors.lines[index].debitCredit}</div>}
                {errors.lines?.[index]?.creditAmountMismatch && <div className="invalid-feedback">{errors.lines[index].creditAmountMismatch}</div>}
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor={`line_description_${index}`} className="form-label">Line Description (Optional)</label>
              <textarea
                className="form-control"
                id={`line_description_${index}`}
                name="description"
                rows="1"
                value={line.description}
                onChange={(e) => handleLineChange(index, e)}
                placeholder="Specific details for this line item"
              ></textarea>
            </div>
          </div>
        ))}
        {!isEditMode && ( // Only show "Add Another Line" in new entry mode
            <button type="button" className="btn btn-outline-secondary w-100 mb-3" onClick={handleAddLine}>
                <i className="bi bi-plus-circle me-2"></i> Add Another Line
            </button>
        )}

        {/* Balance Summary */}
        {!isEditMode && ( // Only show balance summary for new Journal Entries
        <div className="alert mt-4 p-3 text-center" role="alert" style={{backgroundColor: isBalanced ? '#d4edda' : '#f8d7da'}}>
          <h5 className="mb-2">Balance Check</h5>
          <p className="mb-1">Total Debits: <span className="fw-bold text-danger">${totalDebits.toFixed(2)}</span></p>
          <p className="mb-1">Total Credits: <span className="fw-bold text-success">${totalCredits.toFixed(2)}</span></p>
          {isBalanced ? (
            <p className="fw-bold text-success mb-0"><i className="bi bi-check-circle-fill me-2"></i>Journal Entry is Balanced!</p>
          ) : (
            <p className="fw-bold text-danger mb-0"><i className="bi bi-x-circle-fill me-2"></i>Unbalanced! Difference: ${Math.abs(totalDebits - totalCredits).toFixed(2)}</p>
          )}
          {errors.balance && <div className="text-danger mt-2">{errors.balance}</div>}
        </div>
        )}
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={() => setCurrentPage('transactions', null)}>
          Cancel
        </button>
        <button type="submit" className={`btn btn-primary ${(!isBalanced && !isEditMode) ? 'disabled' : ''}`} disabled={(!isBalanced && !isEditMode)} onClick={handleSubmit}>
          {isEditMode ? 'Save Line Changes' : 'Record Journal Entry'}
        </button>
      </div>

      {/* Confirmation Modal (using Bootstrap classes for display) */}
      {showConfirmation && (
        <div className="modal fade show d-block" tabIndex="-1" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Confirm Journal Entry</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowConfirmation(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to {isEditMode ? 'save changes to this transaction line' : 'record this Journal Entry'}?</p>
                {!isEditMode && (
                  <>
                    <p className="fw-bold">Total Debits: <span className="text-danger">${totalDebits.toFixed(2)}</span></p>
                    <p className="fw-bold">Total Credits: <span className="text-success">${totalCredits.toFixed(2)}</span></p>
                  </>
                )}
                <p className="small text-muted">Ensure all details are correct. Once recorded and posted, this entry can only be corrected via a reversal.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={confirmSubmit}>Confirm & {isEditMode ? 'Save' : 'Record'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecordJournalEntryPage;
