// /04-Application/backend/frontend/src/components/TransactionFormModal.jsx

import React, { useState, useEffect } from 'react';

function TransactionFormModal({ show, onClose, onSubmit, transaction, accounts, users, branches }) {
  // Initial state for a new journal entry
  const initialJournalEntryState = {
    transaction_no: '',
    transaction_type: 'Journal Entry', // Default type
    date: new Date().toISOString().split('T')[0], // Default to today's date
    description: '',
    reference_no: '',
    is_posted: true, // Default to posted for new entries, though user might change for drafts
    addedby: users.length > 0 ? users[0].user_id : '', // Default to first available user
    branch_id: branches.length > 0 ? branches[0].branch_id : '', // Default to first available branch
    lines: [ // Start with one empty line
      {
        account_id: '',
        amount: '',
        debit: '',
        credit: '',
        description: '', // Line-specific description
      }
    ]
  };

  const [journalEntry, setJournalEntry] = useState(initialJournalEntryState);
  const [errors, setErrors] = useState({});

  // Effect to populate form data when 'transaction' prop changes (for editing a single line)
  useEffect(() => {
    if (transaction) {
      // If 'transaction' prop is provided, we are in 'edit single line' mode.
      // The form will show this line, but can still be expanded to add more for a JE.
      setJournalEntry({
        transaction_no: transaction.transaction_no || '',
        transaction_type: transaction.transaction_type || 'Journal Entry',
        date: transaction.date || new Date().toISOString().split('T')[0],
        description: transaction.description || '', // Overall JE description
        reference_no: transaction.reference_no || '',
        is_posted: transaction.is_posted || true,
        addedby: transaction.addedby || (users.length > 0 ? users[0].user_id : ''),
        branch_id: transaction.branch_id || (branches.length > 0 ? branches[0].branch_id : ''),
        lines: [
          {
            transaction_id: transaction.transaction_id, // Keep ID for update
            account_id: transaction.account_id || '',
            amount: parseFloat(transaction.amount) || '',
            debit: parseFloat(transaction.debit) || '',
            credit: parseFloat(transaction.credit) || '',
            description: transaction.description || '', // Line-specific description
          }
        ]
      });
    } else {
      // Reset form for adding new journal entry
      setJournalEntry(initialJournalEntryState);
    }
    setErrors({}); // Clear errors when modal opens/changes context
  }, [transaction, show, accounts, users, branches]); // Depend on show, transaction, and lookup data

  // Calculate totals for validation display
  const totalDebits = journalEntry.lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredits = journalEntry.lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Tolerance for float precision

  const handleJournalEntryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJournalEntry(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLineChange = (index, e) => {
    const { name, value } = e.target;
    const newLines = [...journalEntry.lines];
    newLines[index][name] = value;

    // Auto-fill amount based on debit/credit, and ensure only one is positive
    if (name === 'debit') {
      newLines[index].amount = value;
      if (value > 0) newLines[index].credit = 0;
    } else if (name === 'credit') {
      newLines[index].amount = value;
      if (value > 0) newLines[index].debit = 0;
    } else if (name === 'amount') {
        // If amount is changed, reset debit/credit to encourage re-entry or selection
        // Or, assume debit if default behavior, otherwise user manually enters debit/credit
        if (newLines[index].debit > 0) {
            newLines[index].debit = value;
        } else if (newLines[index].credit > 0) {
            newLines[index].credit = value;
        }
    }
    setJournalEntry(prev => ({
      ...prev,
      lines: newLines
    }));
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

  const validateForm = () => {
    const newErrors = {};
    // Overall Journal Entry Validation
    if (!journalEntry.transaction_no.trim()) newErrors.transaction_no = 'Journal Entry Number is required.';
    if (!journalEntry.transaction_type.trim()) newErrors.transaction_type = 'Transaction Type is required.';
    if (!journalEntry.date) newErrors.date = 'Date is required.';
    if (!journalEntry.addedby) newErrors.addedby = 'User (Added By) is required.';
    if (!journalEntry.branch_id) newErrors.branch_id = 'Branch is required.';

    // Line-item Validation
    const lineErrors = journalEntry.lines.map((line, index) => {
      const lineSpecificErrors = {};
      if (!line.account_id) lineSpecificErrors.account_id = 'Account is required.';
      if (isNaN(parseFloat(line.amount)) || parseFloat(line.amount) <= 0) {
        lineSpecificErrors.amount = 'Amount must be a positive number.';
      }
      if ((!line.debit && !line.credit) || (line.debit > 0 && line.credit > 0)) {
        lineSpecificErrors.debitCredit = 'Must be either Debit OR Credit.';
      }
      // Ensure amount matches debit/credit if one is set
      if (line.debit > 0 && parseFloat(line.debit) !== parseFloat(line.amount)) {
          lineSpecificErrors.debitAmountMismatch = 'Debit must match Amount.';
      }
      if (line.credit > 0 && parseFloat(line.credit) !== parseFloat(line.amount)) {
          lineSpecificErrors.creditAmountMismatch = 'Credit must match Amount.';
      }
      // Check if account_id actually exists in provided accounts list
      if (line.account_id && !accounts.some(acc => acc.account_id === line.account_id)) {
        lineSpecificErrors.account_id_invalid = 'Selected account does not exist.';
      }
      return Object.keys(lineSpecificErrors).length > 0 ? lineSpecificErrors : null;
    });

    if (lineErrors.some(err => err !== null)) {
      newErrors.lines = lineErrors;
    }

    // Double-Entry Balance Validation (only for new entries or if changed significantly)
    // For updates of a single line, this check is more complex and usually handled on backend with context of other lines for that JE.
    if (!transaction && !isBalanced) { // Only enforce strict balance check for new full journal entries
      newErrors.balance = 'Total Debits and Total Credits must be equal.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !newErrors.lines; // No overall or line-specific errors
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Prepare data for submission
      const dataToSubmit = {
        transaction_no: journalEntry.transaction_no,
        transaction_type: journalEntry.transaction_type,
        date: journalEntry.date,
        description: journalEntry.description,
        reference_no: journalEntry.reference_no,
        is_posted: journalEntry.is_posted,
        addedby: journalEntry.addedby,
        branch_id: journalEntry.branch_id,
        // Backend expects an array of line objects, each containing common fields + line-specifics
        // We'll map the lines and include the common JE data in each line for the backend structure.
        // This is based on how your createTransaction backend API expects an array of objects
        // each having transaction_no, date, branch_id, addedby etc.
        ...(!transaction && { // Only include these if creating a new full JE
          lines: journalEntry.lines.map(line => ({
            ...line, // line-specific fields
            transaction_no: journalEntry.transaction_no,
            transaction_type: journalEntry.transaction_type, // Common type for all lines of JE
            date: journalEntry.date,
            description: line.description || journalEntry.description, // Use line desc if exists, else JE desc
            reference_no: journalEntry.reference_no,
            is_posted: journalEntry.is_posted,
            addedby: journalEntry.addedby,
            branch_id: journalEntry.branch_id,
          }))
        })
      };

      // If we are in 'edit single transaction line' mode, dataToSubmit is just that one line
      if (transaction) {
          onSubmit(journalEntry.lines[0]); // Pass only the single modified line for update
      } else {
          // For new journal entry, pass the array of fully formed lines
          onSubmit(journalEntry.lines.map(line => ({
            ...line, // line-specific fields
            transaction_no: journalEntry.transaction_no,
            transaction_type: journalEntry.transaction_type,
            date: journalEntry.date,
            description: line.description || journalEntry.description,
            reference_no: journalEntry.reference_no,
            is_posted: journalEntry.is_posted,
            addedby: journalEntry.addedby,
            branch_id: journalEntry.branch_id,
          })));
      }
    }
  };

  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' } : {};

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document"> {/* Larger modal */}
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">{transaction ? 'Edit Transaction Line' : 'Record New Journal Entry'}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Common Journal Entry Fields */}
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
                    readOnly={!!transaction} // Read-only if editing a specific line
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
                    readOnly={!!transaction}
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
                    disabled={!!transaction}
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
                <div className="col-md-6 mb-3">
                  <label htmlFor="addedby" className="form-label">Recorded By (User)</label>
                  <select
                    className={`form-select ${errors.addedby ? 'is-invalid' : ''}`}
                    id="addedby"
                    name="addedby"
                    value={journalEntry.addedby}
                    onChange={handleJournalEntryChange}
                    disabled={!!transaction}
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user.user_id} value={user.user_id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {errors.addedby && <div className="invalid-feedback">{errors.addedby}</div>}
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
                  readOnly={!!transaction}
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
                  disabled={!!transaction} // Prevent changing posted status directly when editing
                />
                <label className="form-check-label" htmlFor="is_posted">Is Posted (Finalized)</label>
                <small className="form-text text-muted d-block">Once posted, transactions cannot be edited directly, only reversed.</small>
              </div>

              <hr className="my-4" />

              {/* Transaction Lines Section */}
              <h5 className="mb-3">Journal Entry Lines</h5>
              {journalEntry.lines.map((line, index) => (
                <div key={index} className="card mb-3 p-3 shadow-sm border">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Line {index + 1}</h6>
                    {journalEntry.lines.length > 1 && (
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
                        disabled={!!transaction && line.transaction_id} // Disable if editing an existing line by its ID
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
                    ></textarea>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-outline-secondary w-100 mb-3" onClick={handleAddLine}>
                <i className="bi bi-plus-circle me-2"></i> Add Another Line
              </button>

              {/* Balance Summary */}
              {!transaction && ( // Only show balance summary for new Journal Entries
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
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className={`btn btn-primary ${!isBalanced && !transaction ? 'disabled' : ''}`} disabled={!isBalanced && !transaction}>
                {transaction ? 'Save Line Changes' : 'Record Journal Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransactionFormModal;
