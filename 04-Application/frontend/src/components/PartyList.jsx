// /04-Application/backend/frontend/src/components/PartyList.jsx

import React from 'react';

function PartyList({ parties, loading, error, onEdit, onViewDetails }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="ms-3 text-primary">Loading parties...</p>
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

  if (parties.length === 0) {
    return (
      <div className="alert alert-info text-center" role="alert">
        No parties found. Click "Add New Party" to get started!
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped shadow-sm rounded-3 overflow-hidden">
        <thead className="bg-primary text-white">
          <tr>
            <th scope="col">#</th>
            <th scope="col">First Name</th>
            <th scope="col">Last Name</th>
            <th scope="col">Type</th>
            <th scope="col">Email</th>
            <th scope="col">Phone</th>
            <th scope="col" className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((party, index) => (
            <tr key={party.party_id}>
              <th scope="row">{index + 1}</th>
              <td>{party.first_name}</td>
              <td>{party.last_name}</td>
              <td>
                <span className={`badge ${party.party_type === 'Customer' ? 'bg-info' : 'bg-secondary'}`}>
                  {party.party_type}
                </span>
              </td>
              <td>{party.contact_info?.email || 'N/A'}</td>
              <td>{party.contact_info?.phone || 'N/A'}</td>
              <td className="text-center">
                {/* Actions Buttons */}
                <button
                  className="btn btn-sm btn-outline-primary me-2"
                  onClick={() => onEdit(party)}
                  title="Edit Party"
                >
                  <i className="bi bi-pencil"></i> Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => onViewDetails(party)}
                  title="View Details"
                >
                  <i className="bi bi-eye"></i> Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PartyList;
