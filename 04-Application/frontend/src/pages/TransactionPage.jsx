// /04-Application/backend/frontend/src/TransactionPage.jsx

import React from 'react';

function TransactionPage() {
  return (
    <div className="container py-4">
      <h2 className="h3 fw-semibold text-dark mb-3">
        <i className="bi bi-wallet-fill me-3 text-success"></i> Chart of Accounts & Transactions
      </h2>
      <p className="text-muted">This section allows you to manage your Chart of Accounts and record detailed financial transactions following double-entry principles.</p>
      <div className="mt-4">
        <button className="btn btn-primary me-2">View Chart of Accounts</button>
        <button className="btn btn-info text-white">Record New Transaction</button>
      </div>
      {/* Future: Add Chart of Accounts List/Form and Transaction List/Form components here */}
    </div>
  );
}

export default TransactionPage;