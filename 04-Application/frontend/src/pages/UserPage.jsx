// /04-Application/backend/frontend/src/pages/UserPage.jsx

import React from 'react';

function UserPage() {
  return (
    <div className="container py-4">
      <h2 className="h3 fw-semibold text-dark mb-3">
        <i className="bi bi-person-circle me-3 text-secondary"></i> Users
      </h2>
      <p className="text-muted">This section allows you to manage system users, roles, and access.</p>
      <div className="mt-4">
        <button className="btn btn-primary me-2">View Users</button>
        <button className="btn btn-secondary">Add New User</button>
      </div>
    </div>
  );
}

export default UserPage;