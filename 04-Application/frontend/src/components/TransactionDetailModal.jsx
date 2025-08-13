// /04-Application/backend/frontend/src/components/TransactionDetailModal.jsx

import React from 'react';

function TransactionDetailModal({ show, onClose, selectedTransactionNo, allTransactions, accounts, users, branches }) {
  const modalClass = show ? 'modal fade show d-block' : 'modal fade';
  const modalStyle = show ? { display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' } : {};

  if (!show || !selectedTransactionNo || !allTransactions.length) {
    return null; // Don't render if not visible or no transaction selected/data available
  }

  // Filter for all lines belonging to the selected transaction_no
  const entryLines = allTransactions.filter(tx => tx.transaction_no === selectedTransactionNo)
                                  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // Sort for consistent order

  if (entryLines.length === 0) {
    return (
      <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header bg-secondary text-white">
              <h5 className="modal-title">Journal Entry Details</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="text-center text-danger">No details found for this Journal Entry number.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get common details from the first line of the journal entry
  const firstLine = entryLines[0];
  const addedByUser = users.find(u => u.user_id === firstLine.addedby);
  const branch = branches.find(b => b.branch_id === firstLine.branch_id);

  const totalDebits = entryLines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
  const totalCredits = entryLines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

  return (
    <div className={modalClass} tabIndex="-1" role="dialog" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document"> {/* Larger modal */}
        <div className="modal-content">
          <div className="modal-header bg-info text-white">
            <h5 className="modal-title">Journal Entry Details: {selectedTransactionNo}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <h6 className="text-primary mb-3">Overall Journal Entry Information</h6>
            <dl className="row mb-4">
              <dt className="col-sm-4">Transaction No.:</dt>
              <dd className="col-sm-8">{firstLine.transaction_no}</dd>

              <dt className="col-sm-4">Date:</dt>
              <dd className="col-sm-8">{new Date(firstLine.date).toLocaleDateString()}</dd>

              <dt className="col-sm-4">Type:</dt>
              <dd className="col-sm-8">{firstLine.transaction_type}</dd>

              <dt className="col-sm-4">Description:</dt>
              <dd className="col-sm-8">{firstLine.description || 'N/A'}</dd>

              <dt className="col-sm-4">Branch:</dt>
              <dd className="col-sm-8">{branch ? branch.name : 'N/A'}</dd>

              <dt className="col-sm-4">Added By:</dt>
              <dd className="col-sm-8">{addedByUser ? `${addedByUser.first_name} ${addedByUser.last_name}` : 'N/A'}</dd>

              <dt className="col-sm-4">Reference No.:</dt>
              <dd className="col-sm-8">{firstLine.reference_no || 'N/A'}</dd>

              <dt className="col-sm-4">Is Posted:</dt>
              <dd className="col-sm-8">{firstLine.is_posted ? 'Yes' : 'No'}</dd>

              <dt className="col-sm-4">Total Debits:</dt>
              <dd className="col-sm-8 text-danger fw-bold">${totalDebits.toFixed(2)}</dd>

              <dt className="col-sm-4">Total Credits:</dt>
              <dd className="col-sm-8 text-success fw-bold">${totalCredits.toFixed(2)}</dd>
            </dl>

            <h6 className="text-primary mb-3">Individual Transaction Lines</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Account</th>
                    <th className="text-end">Debit</th>
                    <th className="text-end">Credit</th>
                    <th>Line Description</th>
                  </tr>
                </thead>
                <tbody>
                  {entryLines.map(line => {
                    const account = accounts.find(acc => acc.account_id === line.account_id);
                    return (
                      <tr key={line.transaction_id}>
                        <td>{account ? account.name : 'N/A'}</td>
                        <td className="text-end text-danger">{line.debit > 0 ? `$${parseFloat(line.debit).toFixed(2)}` : '-'}</td>
                        <td className="text-end text-success">{line.credit > 0 ? `$${parseFloat(line.credit).toFixed(2)}` : '-'}</td>
                        <td>{line.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailModal;
