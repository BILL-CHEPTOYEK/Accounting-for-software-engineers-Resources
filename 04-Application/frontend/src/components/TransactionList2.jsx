// /04-Application/frontend/src/components/TransactionList2.jsx
// Double-Entry Bookkeeping Transaction Display
// 
// This component displays journal entries following double-entry accounting principles:
// 1. Each row represents a complete journal entry (multiple transaction lines grouped by transaction_no)
// 2. Every journal entry must have equal debits and credits (fundamental accounting equation)
// 3. Debit accounts show where money/value went (expenses, assets, drawings)
// 4. Credit accounts show where money/value came from (income, liabilities, capital)
// 5. The total amount represents the balanced debit/credit sum
//
// Example: Office Supplies Purchase ($500)
// - Debit: Office Supplies Expense ($500) - where the money went
// - Credit: Cash Account ($500) - where the money came from
// Result: Debits ($500) = Credits ($500) ✓

import React from 'react';

function TransactionList2({ transactions, loading, error, onEdit, onViewDetails, onReverseJournalEntry, accounts, users, branches }) {
  // Function to clean description by removing reference patterns
  const cleanDescription = (description) => {
    if (!description) return 'Journal Entry';
    
    // Remove reference patterns like (Ref: PMT-BIL-...), (Ref: INV-...), etc.
    let cleaned = description.replace(/\(Ref:\s*[^)]+\)/gi, '').trim();
    
    // If the description becomes empty after cleaning, use default
    if (!cleaned) return 'Journal Entry';
    
    // Limit length for better table readability - no truncation, let it wrap naturally
    return cleaned;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary fw-semibold">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center fw-semibold border-0 shadow-sm" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="card border-0 shadow-sm">
        <div className="card-body text-center py-5">
          <i className="bi bi-journal-x fs-1 text-muted mb-3"></i>
          <h5 className="text-muted">No journal entries found</h5>
          <p className="text-muted">Click <strong>"Record New Journal Entry"</strong> to get started!</p>
        </div>
      </div>
    );
  }

  const groupedTransactions = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.transaction_no]) {
      acc[transaction.transaction_no] = [];
    }
    acc[transaction.transaction_no].push(transaction);
    return acc;
  }, {});

  const sortedTransactionNos = Object.keys(groupedTransactions).sort((a, b) => {
    const dateA = new Date(groupedTransactions[a][0].created_at);
    const dateB = new Date(groupedTransactions[b][0].created_at);
    return dateB - dateA;
  });

  return (
    <div className="table-responsive rounded-3 border shadow-sm">
      <table className="table table-hover mb-0">
        <thead className="table-dark">
          <tr>
            <th className="py-3 px-4 fw-semibold">Date</th>
            <th className="py-3 px-4 fw-semibold">Journal #</th>
            <th className="py-3 px-4 fw-semibold">Description</th>
            <th className="py-3 px-4 fw-semibold text-end">
              Amount
              <small className="d-block text-muted fw-normal" style={{ fontSize: '0.7rem' }}>
                (De)
              </small>
            </th>
            <th className="py-3 px-4 fw-semibold">Debit Accounts</th>
            <th className="py-3 px-4 fw-semibold">Credit Accounts</th>
            <th className="py-3 px-4 fw-semibold text-center">Status</th>
            <th className="py-3 px-4 fw-semibold text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactionNos.map(transactionNo => {
            const entryLines = groupedTransactions[transactionNo];
            const firstLine = entryLines[0];
            const totalAmount = entryLines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
            const totalCredits = entryLines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);
            const isBalanced = Math.abs(totalAmount - totalCredits) < 0.01; // Account for floating point precision
            const isJournalEntryPosted = entryLines.some(line => line.is_posted);

            // Get debit and credit accounts (remove duplicates)
            const debitAccounts = [...new Set(entryLines
              .filter(line => parseFloat(line.debit || 0) > 0)
              .map(line => {
                const account = accounts.find(acc => acc.account_id === line.account_id);
                return account ? account.name : 'Unknown Account';
              }))];

            const creditAccounts = [...new Set(entryLines
              .filter(line => parseFloat(line.credit || 0) > 0)
              .map(line => {
                const account = accounts.find(acc => acc.account_id === line.account_id);
                return account ? account.name : 'Unknown Account';
              }))];

            return (
              <tr key={transactionNo} className="border-bottom">
                <td className="py-3 px-4">
                  {new Date(firstLine.date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <span className="text-muted fw-medium" style={{ fontSize: '0.9rem' }}>
                    {firstLine.transaction_no}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="fw-medium" style={{ fontSize: '0.9rem', lineHeight: '1.3', maxWidth: '200px' }}>
                    {cleanDescription(firstLine.description)}
                  </div>
                </td>
                <td className="py-3 px-4 text-end">
                  <div className="d-flex align-items-center justify-content-end">
                    <span className="fw-semibold">${totalAmount.toFixed(2)}</span>
                    {isBalanced ? (
                      <i className="bi bi-check-circle-fill text-success ms-2" 
                         title="Double-entry balanced: Debits = Credits"></i>
                    ) : (
                      <i className="bi bi-exclamation-triangle-fill text-warning ms-2" 
                         title="Warning: Debits ≠ Credits"></i>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="d-flex flex-wrap gap-1">
                    {debitAccounts.map((account, index) => (
                      <div key={index} className="text-success fw-medium" style={{ fontSize: '0.85rem' }}>
                        {account}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="d-flex flex-wrap gap-1">
                    {creditAccounts.map((account, index) => (
                      <div key={index} className="text-info fw-medium" style={{ fontSize: '0.85rem' }}>
                        {account}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  {isJournalEntryPosted ? (
                    <span className="badge bg-success bg-opacity-75">Posted</span>
                  ) : (
                    <span className="badge bg-secondary bg-opacity-75">Draft</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="d-flex gap-1 justify-content-center">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => onViewDetails(transactionNo)}
                      title="View Details"
                      style={{ 
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem'
                      }}
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {isJournalEntryPosted ? (
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => onReverseJournalEntry(transactionNo)}
                        title="Reverse Entry"
                        style={{ 
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => alert('Deletion of unposted Journal Entry will be implemented here.')}
                        title="Delete Entry"
                        style={{ 
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem'
                        }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList2;
