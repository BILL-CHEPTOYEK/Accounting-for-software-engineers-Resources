// /04-Application/backend/frontend/src/PartyPage.jsx

import React from 'react';

function PartyPage() {
  return (
    <div className="container py-4">
      <h2 className="h3 fw-semibold text-dark mb-3">
        <i className="bi bi-people-fill me-3 text-info"></i> Parties (Customers & Suppliers)
      </h2>
      <p className="text-muted">This is where you will manage your parties. You can list, add, edit, and delete party records here.</p>
      <div className="mt-4">
        <button className="btn btn-primary me-2">View Party List</button>
        <button className="btn btn-success">Add New Party</button>
      </div>
      {/* Future: Add Party List and Form components here */}
    </div>
  );
}

export default PartyPage;