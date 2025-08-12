// /04-Application/backend/frontend/src/pages/ChartOfAccountPage.jsx

import React from 'react';

function ChartOfAccountPage() {
  return (
    <div className="container py-4">
      <h2 className="h3 fw-semibold text-dark mb-3">
        <i className="bi bi-journal-check me-3 text-secondary"></i> Chart of Accounts
      </h2>
      <p className="text-muted">Here you can define and manage your detailed individual accounts like Cash, Accounts Receivable, etc.</p>
      <div className="mt-4">
        <button className="btn btn-primary me-2">View Chart of Accounts</button>
        <button className="btn btn-secondary">Add New Account</button>
      </div>
    </div>
  );
}

export default ChartOfAccountPage;