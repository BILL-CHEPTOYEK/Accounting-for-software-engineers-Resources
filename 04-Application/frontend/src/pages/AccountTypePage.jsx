// /04-Application/backend/frontend/src/pages/AccountTypePage.jsx

import React from 'react';

function AccountTypePage() {
  return (
    <div className="container py-4">
      <h2 className="h3 fw-semibold text-dark mb-3">
        <i className="bi bi-bar-chart-fill me-3 text-secondary"></i> Account Types
      </h2>
      <p className="text-muted">This page will manage your general account types (e.g., Assets, Liabilities, Revenue).</p>
      <div className="mt-4">
        <button className="btn btn-primary me-2">View Account Types</button>
        <button className="btn btn-secondary">Add New Account Type</button>
      </div>
    </div>
  );
}

export default AccountTypePage;