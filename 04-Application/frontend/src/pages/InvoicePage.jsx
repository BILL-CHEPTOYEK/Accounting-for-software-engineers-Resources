// /04-Application/backend/frontend/src/InvoicePage.jsx

import React from 'react';

function InvoicePage() {
  return (
    <div className="container py-4">
      <h2 className="h3 fw-semibold text-dark mb-3">
        <i className="bi bi-receipt-cutoff me-3 text-danger"></i> Invoices & Bills
      </h2>
      <p className="text-muted">Manage your sales invoices and purchase bills here. Track their status and amounts.</p>
      <div className="mt-4">
        <button className="btn btn-primary me-2">View Invoice List</button>
        <button className="btn btn-warning text-white">Create New Invoice</button>
      </div>
      {/* Future: Add Invoice List and Form components here */}
    </div>
  );
}

export default InvoicePage;