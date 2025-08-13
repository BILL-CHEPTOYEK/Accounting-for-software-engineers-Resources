// /04-Application/backend/frontend/src/components/TransactionList.jsx

import React from 'react';

function TransactionList({ transactions, loading, error, onEdit, onViewDetails, onReverseJournalEntry, accounts, users, branches }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center" role="alert">
        {error}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="alert alert-info text-center" role="alert">
        No transactions found. Click "Record New Journal Entry" to get started!
      </div>
    );
  }

  // Group transactions by transaction_no to represent journal entries
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.transaction_no]) {
      acc[transaction.transaction_no] = [];
    }
    acc[transaction.transaction_no].push(transaction);
    return acc;
  }, {});

  // Sort groups by the creation date of their first transaction (most recent first)
  const sortedTransactionNos = Object.keys(groupedTransactions).sort((a, b) => {
    const dateA = new Date(groupedTransactions[a][0].created_at);
    const dateB = new Date(groupedTransactions[b][0].created_at);
    return dateB - dateA;
  });

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped shadow-sm rounded-3 overflow-hidden">
        <thead className="bg-success text-white"> {/* Using bg-success for transactions */}
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Journal Entry #</th>
            <th scope="col">Description (Overall)</th>
            <th scope="col">Branch</th>
            <th scope="col">Added By</th>
            <th scope="col" className="text-end">Total Debit</th>
            <th scope="col" className="text-end">Total Credit</th>
            <th scope="col" className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactionNos.map((transactionNo) => {
            const entryLines = groupedTransactions[transactionNo];
            const firstLine = entryLines[0]; // Use first line for common info
            const totalDebits = entryLines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
            const totalCredits = entryLines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

            // Find full user and branch names for display
            const addedByUser = users.find(u => u.user_id === firstLine.addedby);
            const branch = branches.find(b => b.branch_id === firstLine.branch_id);

            // Determine if the *entire journal entry* is posted (check if at least one line is posted)
            const isJournalEntryPosted = entryLines.some(line => line.is_posted);

            return (
              <React.Fragment key={transactionNo}>
                {/* Main Journal Entry Row */}
                <tr className="table-primary fw-bold">
                  <td>{new Date(firstLine.date).toLocaleDateString()}</td>
                  <td>{firstLine.transaction_no}</td>
                  <td>{firstLine.description}</td> {/* Using first line's description for overall */}
                  <td>{branch ? branch.name : 'N/A'}</td>
                  <td>{addedByUser ? `${addedByUser.first_name} ${addedByUser.last_name}` : 'N/A'}</td>
                  <td className="text-end text-danger">${totalDebits.toFixed(2)}</td>
                  <td className="text-end text-success">${totalCredits.toFixed(2)}</td>
                  <td className="text-center">
                    {/* View Details button for the entire JE */}
                    <button
                        className="btn btn-sm btn-outline-info me-2"
                        onClick={() => onViewDetails(transactionNo)} // Pass transactionNo
                        title="View Journal Entry Details"
                    >
                        <i className="bi bi-eye"></i> Details
                    </button>
                    {/* Reverse JE button - always available for a posted JE */}
                    {isJournalEntryPosted && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onReverseJournalEntry(transactionNo)}
                        title="Reverse Journal Entry"
                      >
                        <i className="bi bi-arrow-counterclockwise"></i> Reverse JE
                      </button>
                    )}
                    {/* Conditional Delete button for UNPOSTED JE (e.g., drafts) */}
                    {!isJournalEntryPosted && (
                        <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => {
                                // Implement deletion logic for unposted JE here if needed
                                // (e.g., prompt for confirmation, then call transactionApi.deleteTransaction for all lines with this JE number)
                                alert('Deletion of unposted Journal Entry will be implemented here. For now, contact admin.');
                            }}
                            title="Delete Unposted Journal Entry"
                        >
                            <i className="bi bi-trash"></i> Delete JE
                        </button>
                    )}
                  </td>
                </tr>
                {/* Individual Transaction Lines (listed as sub-rows) */}
                {entryLines.map((line, lineIndex) => {
                  const account = accounts.find(acc => acc.account_id === line.account_id);
                  return (
                    <tr key={line.transaction_id} className="small text-muted">
                      <td></td> {/* Empty for alignment */}
                      <td></td>
                      <td colSpan="1" className="ps-4">
                        &mdash; {account ? account.name : 'N/A'}
                        {line.reference_no && ` (Ref: ${line.reference_no})`}
                      </td>
                      <td></td> {/* Empty */}
                      <td></td> {/* Empty */}
                      <td className="text-end text-danger">{parseFloat(line.debit) > 0 ? `$${parseFloat(line.debit).toFixed(2)}` : '-'}</td>
                      <td className="text-end text-success">{parseFloat(line.credit) > 0 ? `$${parseFloat(line.credit).toFixed(2)}` : '-'}</td>
                      <td className="text-center">
                         {/* Edit button for individual lines, only if NOT POSTED */}
                         {!line.is_posted && (
                             <button
                                 className="btn btn-sm btn-outline-secondary"
                                 onClick={() => onEdit(line)} // Pass the specific line for editing
                                 title="Edit This Transaction Line"
                             >
                                 <i className="bi bi-pencil"></i> Edit Line
                             </button>
                         )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;
