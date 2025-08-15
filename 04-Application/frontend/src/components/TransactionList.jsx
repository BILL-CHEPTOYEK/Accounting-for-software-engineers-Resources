import React from 'react';

function TransactionList({ transactions, loading, error, onEdit, onViewDetails, onReverseJournalEntry, accounts, users, branches }) {
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
      <div className="alert alert-danger text-center fw-semibold" role="alert">
        {error}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="alert alert-info text-center fw-semibold" role="alert">
        No transactions found. Click <strong>"Record New Journal Entry"</strong> to get started!
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
    <div className="table-responsive shadow-sm rounded">
      <table className="table table-hover table-striped align-middle mb-0">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Journal #</th>
            <th>Description</th>
            <th>Branch</th>
            <th>Added By</th>
            <th className="text-end">Total Debit</th>
            <th className="text-end">Total Credit</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactionNos.map(transactionNo => {
            const entryLines = groupedTransactions[transactionNo];
            const firstLine = entryLines[0];
            const totalDebits = entryLines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0);
            const totalCredits = entryLines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0);

            const addedByUser = users.find(u => u.user_id === firstLine.addedby);
            const branch = branches.find(b => b.branch_id === firstLine.branch_id);
            const isJournalEntryPosted = entryLines.some(line => line.is_posted);

            return (
              <React.Fragment key={transactionNo}>
                {/* Main Journal Row */}
                <tr className="table-primary fw-semibold">
                  <td>{new Date(firstLine.date).toLocaleDateString()}</td>
                  <td>{firstLine.transaction_no}</td>
                  <td>{firstLine.description}</td>
                  <td>{branch ? branch.name : 'N/A'}</td>
                  <td>{addedByUser ? `${addedByUser.first_name} ${addedByUser.last_name}` : 'N/A'}</td>
                  <td className="text-end text-danger">${totalDebits.toFixed(2)}</td>
                  <td className="text-end text-success">${totalCredits.toFixed(2)}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-info me-2"
                      onClick={() => onViewDetails(transactionNo)}
                      title="View Journal Entry Details"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                    {isJournalEntryPosted && (
                      <button
                        className="btn btn-sm btn-outline-danger me-2"
                        onClick={() => onReverseJournalEntry(transactionNo)}
                        title="Reverse Journal Entry"
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                      </button>
                    )}
                    {!isJournalEntryPosted && (
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => alert('Deletion of unposted Journal Entry will be implemented here.')}
                        title="Delete Unposted Journal Entry"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </td>
                </tr>

                {/* Line Items */}
                {entryLines.map(line => {
                  const account = accounts.find(acc => acc.account_id === line.account_id);
                  return (
                    <tr key={line.transaction_id} className="small text-muted">
                      <td colSpan="2"></td>
                      <td>
                        — {account ? account.name : 'N/A'} {line.reference_no && `(Ref: ${line.reference_no})`}
                      </td>
                      <td colSpan="2"></td>
                      <td className="text-end text-danger">
                        {parseFloat(line.debit) > 0 ? `$${parseFloat(line.debit).toFixed(2)}` : '-'}
                      </td>
                      <td className="text-end text-success">
                        {parseFloat(line.credit) > 0 ? `$${parseFloat(line.credit).toFixed(2)}` : '-'}
                      </td>
                      <td className="text-center">
                        {!line.is_posted && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => onEdit(line)}
                            title="Edit This Transaction Line"
                          >
                            <i className="bi bi-pencil"></i>
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
