// /04-Application/backend/frontend/src/pages/BranchPage.jsx

import React from 'react';

function BranchPage() {
  return (
    <div className="container py-4">
      <h2 className="h3 fw-semibold text-dark mb-3">
        <i className="bi bi-building-fill me-3 text-secondary"></i> Branches.
      </h2>
      <p className="text-muted">Manage your various business branches or locations from this page</p>
      <div className="mt-4">
        <button className="btn btn-primary me-2">View Branches</button>
        <button className="btn btn-secondary">Add New Branch</button>
      </div>
    </div>
  );
}

export default BranchPage;